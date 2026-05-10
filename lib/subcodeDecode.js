import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ─── DOMAINS (20 total) ───────────────────────────────────────────────────────

export const DOMAINS = [
  // Core 7
  'emotional', 'spiritual', 'physical', 'financial', 'creative', 'social', 'mental',
  // Extended 13
  'identity', 'purpose', 'relationships', 'career', 'habits', 'shadow',
  'time', 'power', 'communication', 'environment', 'abundance', 'growth', 'body',
];

export const DOMAIN_DESCRIPTIONS = {
  emotional:     'Feelings, mood states, emotional reactivity and regulation',
  spiritual:     'Meaning, connection, faith, transcendence',
  physical:      'Health, vitality, physical capacity',
  financial:     'Money, security, resource management',
  creative:      'Expression, ideas, imagination, art',
  social:        'Community, belonging, group dynamics',
  mental:        'Thoughts, beliefs, cognitive patterns',
  identity:      'Self-concept, values, who you believe you are',
  purpose:       'Mission, direction, reason for being',
  relationships: 'Deep connections, intimacy, attachment patterns',
  career:        'Ambition, achievement, professional identity',
  habits:        'Patterns, rituals, routines, recurring cycles',
  shadow:        'Fear, shame, suppression, what you avoid seeing',
  time:          'Urgency, priorities, procrastination, presence',
  power:         'Agency, control, autonomy, choice-making',
  communication: 'Expression, listening, conflict, finding voice',
  environment:   'Space, context, external triggers, surroundings',
  abundance:     'Receiving, giving, scarcity vs. wealth mindset',
  growth:        'Learning, evolution, resistance to change',
  body:          'Somatic sensation, physical intuition, embodiment',
};

const domainScoresSchema = DOMAINS.map(d => `    "${d}": 0`).join(',\n');

const DECODE_SCHEMA = `{
  "causation": "2-3 sentence analysis of the underlying causal force this input reveals",
  "past_echo": "which past pattern, version, or subconscious loop this echoes",
  "blindspot": "the thing this input reveals that the person is NOT seeing",
  "action": "one specific, concrete present action to take",
  "foundation_piece": "what this contributes to the person's ideal self blueprint",
  "self_version": "semantic version string x.y — increment from history, start at 1.0",
  "archetype": "The [Name] — 2-3 word archetype label",
  "archetype_reason": "one sentence explaining why this archetype emerged",
  "timeline_label": "5-7 word poetic label for this moment",
  "domains": ["array of all implicated domain ids with score > 0"],
  "domain_scores": {
${domainScoresSchema}
  },
  "intensity": 7,
  "duality": "the tension or duality between who they are and who they are becoming"
}`;

const IDEAL_SELF_SCHEMA = `{
  "declaration": "one powerful present-tense identity declaration",
  "core_identity": "2-3 sentences — who they fundamentally are at their highest",
  "mission": "one sentence life mission",
  "dominant_pattern": "single most recurring subconscious theme across all data",
  "collective_blindspot": "the pattern they most consistently avoid seeing",
  "duality_resolution": "the core tension between current and ideal self, and how to resolve it",
  "foundation_pillars": ["4-6 short pillar phrases"],
  "action_roadmap": [{ "domain": "domain_id", "action": "specific action", "why": "one sentence" }],
  "ideal_domain_scores": {${DOMAINS.map(d => `"${d}": 0`).join(', ')}},
  "current_domain_scores": {${DOMAINS.map(d => `"${d}": 0`).join(', ')}},
  "evolution_path": "2-3 sentences — arc from who they've been to who they're becoming",
  "next_threshold": "the one shift that unlocks everything right now"
}`;

const VERSION_SCHEMA = `{
  "version": "x.y",
  "archetype": "The [Name]",
  "summary": "2 sentence summary of who this person was in this period",
  "dominant_domain": "domain_id",
  "growth_edge": "what was pushing them to evolve",
  "shadow_edge": "what was holding them back"
}`;

const PATTERN_SYNTHESIS_SCHEMA = `{
  "causation_narrative": "2-3 sentences naming the core causal engine driving this person's patterns",
  "dominant_loop": "the single most powerful recurring subconscious loop across all inputs",
  "co_activation_labels": [
    { "domains": ["domain1", "domain2"], "label": "2-4 word name for this cluster", "meaning": "one sentence what this pairing reveals" }
  ],
  "trend_interpretation": "2 sentences interpreting the rising and falling domain trends",
  "next_unlock": "the single pattern shift that would cascade change across the most domains"
}`;

// ─── MEMORY STORE ─────────────────────────────────────────────────────────────

export class MemoryStore {
  constructor(filePath = '/tmp/subcode_memory.json') {
    this.filePath = filePath;
    this._data = this._load();
  }

  _load() {
    if (fs.existsSync(this.filePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      } catch {}
    }
    return {
      created_at: new Date().toISOString(),
      entries: [],
      versions: [],
      ideal_self: null,
      meta: {
        total_entries: 0,
        current_version: '0.0',
        current_archetype: null,
        domain_heat: Object.fromEntries(DOMAINS.map(d => [d, 0])),
      },
    };
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this._data, null, 2), 'utf-8');
  }

  addEntry(entry) {
    this._data.entries.unshift(entry);
    this._data.meta.total_entries = this._data.entries.length;

    const dec = entry.decoded || {};
    if (dec.self_version) this._data.meta.current_version = dec.self_version;
    if (dec.archetype) this._data.meta.current_archetype = dec.archetype;

    const allDomains = [entry.primary_domain, ...(dec.domains || [])];
    for (const d of allDomains) {
      if (d in this._data.meta.domain_heat) this._data.meta.domain_heat[d]++;
    }

    this._data.ideal_self = null;
    this.save();
  }

  addVersion(version) { this._data.versions.push(version); this.save(); }
  setIdealSelf(portrait) { this._data.ideal_self = portrait; this.save(); }

  get entries() { return this._data.entries; }
  get versions() { return this._data.versions; }
  get idealSelf() { return this._data.ideal_self; }
  get meta() { return this._data.meta; }

  getHistoryContext(limit = 10) {
    return this._data.entries.slice(0, limit).map(e => {
      const dec = e.decoded || {};
      const label = (e.content || e.url || '(media)').slice(0, 60);
      return `[v${dec.self_version || '?'}/${dec.archetype || '?'}/${e.primary_domain || '?'}] "${label}"`;
    }).join('\n');
  }

  getFullSummary() {
    const lines = this._data.entries.map(e => {
      const dec = e.decoded || {};
      const label = (e.content || e.url || '(media)').slice(0, 80);
      return [
        `[v${dec.self_version || '?'}/${dec.archetype || '?'}/${e.primary_domain || '?'}] ${label}`,
        `  causation: ${dec.causation || ''}`,
        `  duality: ${dec.duality || ''}`,
        `  foundation: ${dec.foundation_piece || ''}`,
        `  blindspot: ${dec.blindspot || ''}`,
      ].join('\n');
    });
    const versionLines = this._data.versions.map(v =>
      `${v.version} · ${v.archetype} · ${v.week_label || ''}: ${v.summary || ''}`
    );
    return lines.join('\n\n') + (versionLines.length
      ? '\n\nVERSION HISTORY:\n' + versionLines.join('\n') : '');
  }
}

// ─── PATTERN ENGINE ───────────────────────────────────────────────────────────

export function computePatterns(entries) {
  const n = entries.length;

  const confidenceLabel =
    n === 0 ? 'No data yet' :
    n <= 2  ? 'First signals — keep going' :
    n <= 5  ? 'Early patterns emerging' :
    n <= 10 ? 'Patterns forming' :
    n <= 19 ? 'Clear patterns' :
              'Deep pattern data';

  const confidence = Math.min(1, n / 20);

  if (n === 0) {
    return {
      confidence: 0, confidence_label: confidenceLabel, entry_count: 0,
      days_active: 0, dominant_domains: [], domain_averages: Object.fromEntries(DOMAINS.map(d => [d, 0])),
      co_activation_clusters: [], trending: { rising: [], falling: [], stable: [] },
      archetype_arc: [], intensity_distribution: { low: 0, medium: 0, high: 0 },
      blindspot_frequency: [], causation_synthesis: null,
    };
  }

  // Domain averages
  const domainAccum = Object.fromEntries(DOMAINS.map(d => [d, []]));
  entries.forEach(entry => {
    const scores = entry.decoded?.domain_scores || {};
    DOMAINS.forEach(d => domainAccum[d].push(scores[d] || 0));
  });
  const domainAverages = Object.fromEntries(
    DOMAINS.map(d => [d, +(domainAccum[d].reduce((a, b) => a + b, 0) / n).toFixed(2)])
  );

  // Dominant domains (top 5 by average score)
  const dominantDomains = Object.entries(domainAverages)
    .sort(([, a], [, b]) => b - a).slice(0, 5).map(([d]) => d);

  // Trending: compare newest half vs oldest half (entries are newest-first)
  const trending = { rising: [], falling: [], stable: [] };
  if (n >= 4) {
    const mid = Math.ceil(n / 2);
    const recent = entries.slice(0, mid);
    const older = entries.slice(mid);
    const avg = (subset, d) => {
      const vals = subset.map(e => e.decoded?.domain_scores?.[d] || 0);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    DOMAINS.forEach(d => {
      const diff = avg(recent, d) - avg(older, d);
      if (diff > 1.2) trending.rising.push(d);
      else if (diff < -1.2) trending.falling.push(d);
      else if (domainAverages[d] > 1) trending.stable.push(d);
    });
  }

  // Co-activation clusters (pairs that score >= 6 together in >= 40% of entries)
  const coActivation = [];
  if (n >= 5) {
    for (let i = 0; i < DOMAINS.length; i++) {
      for (let j = i + 1; j < DOMAINS.length; j++) {
        const d1 = DOMAINS[i], d2 = DOMAINS[j];
        const count = entries.filter(e => {
          const s = e.decoded?.domain_scores || {};
          return (s[d1] || 0) >= 6 && (s[d2] || 0) >= 6;
        }).length;
        const strength = count / n;
        if (strength >= 0.4) coActivation.push({ domains: [d1, d2], strength: +strength.toFixed(2) });
      }
    }
    coActivation.sort((a, b) => b.strength - a.strength).splice(6);
  }

  // Archetype arc (deduplicated, chronological)
  const archetypeArc = [...new Set(
    entries.slice().reverse().map(e => e.archetype).filter(Boolean)
  )];

  // Intensity distribution
  const intensities = entries.map(e => e.decoded?.intensity || 5);
  const intensityDistribution = {
    low:    intensities.filter(i => i <= 3).length,
    medium: intensities.filter(i => i >= 4 && i <= 6).length,
    high:   intensities.filter(i => i >= 7).length,
  };

  // Blindspot frequency (group similar blindspots by first 40 chars)
  const blindspotMap = {};
  entries.forEach(e => {
    const b = (e.decoded?.blindspot || '').slice(0, 60).trim();
    if (b) blindspotMap[b] = (blindspotMap[b] || 0) + 1;
  });
  const blindspotFrequency = Object.entries(blindspotMap)
    .sort(([, a], [, b]) => b - a).slice(0, 3)
    .map(([pattern, count]) => ({ pattern, count }));

  // Days active
  const oldest = entries[entries.length - 1]?.timestamp;
  const newest = entries[0]?.timestamp;
  const daysActive = oldest && newest
    ? Math.max(1, Math.ceil((new Date(newest) - new Date(oldest)) / 86400000) + 1) : 1;

  return {
    confidence: +confidence.toFixed(2),
    confidence_label: confidenceLabel,
    entry_count: n,
    days_active: daysActive,
    dominant_domains: dominantDomains,
    domain_averages: domainAverages,
    co_activation_clusters: coActivation,
    trending,
    archetype_arc: archetypeArc,
    intensity_distribution: intensityDistribution,
    blindspot_frequency: blindspotFrequency,
    causation_synthesis: null, // filled by AI synthesis if available
  };
}

// ─── SUBCODE DECODE ENGINE ────────────────────────────────────────────────────

export class SubcodeDecode {
  constructor({ apiKey, memoryPath = '/tmp/subcode_memory.json' } = {}) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    this.demoMode = !key;
    this.client = key ? new Anthropic({ apiKey: key }) : null;
    this.memory = new MemoryStore(memoryPath);
  }

  async decode({ content, inputType = 'text', primaryDomain = 'mental', url, notes, timestamp } = {}) {
    if (!DOMAINS.includes(primaryDomain)) {
      throw new Error(`primaryDomain must be one of: ${DOMAINS.join(', ')}`);
    }
    const ts = timestamp || new Date().toISOString();
    const id = uuidv4();

    const textParts = [
      `INPUT TYPE: ${inputType}`,
      `PRIMARY DOMAIN: ${primaryDomain}`,
      content ? `CONTENT: "${content}"` : null,
      url ? `URL: ${url}` : null,
      notes ? `NOTES: "${notes}"` : null,
    ].filter(Boolean);

    const historyContext = this.memory.getHistoryContext();
    if (historyContext) textParts.push(`\nPRIOR HISTORY:\n${historyContext}`);
    textParts.push('\nDecode this input across ALL 20 domains. Continue version numbering from history.');

    const raw = await this._callClaude({
      messages: [{ role: 'user', content: textParts.join('\n') }],
      system: this._decodeSystemPrompt(),
      maxTokens: 1500,
    });

    const entry = {
      id, timestamp: ts, input_type: inputType, primary_domain: primaryDomain,
      content: content || null, url: url || null, notes: notes || null,
      self_version: raw.self_version, archetype: raw.archetype, decoded: raw,
    };
    this.memory.addEntry(entry);
    return entry;
  }

  async getPatterns() {
    const base = computePatterns(this.memory.entries);

    // Enrich with AI synthesis if we have enough data and a key
    if (this.memory.entries.length >= 5) {
      const summary = this._patternSummaryForAI(base);
      const raw = await this._callClaude({
        messages: [{ role: 'user', content: `Pattern data:\n${summary}\n\nSynthesize the pattern narrative.` }],
        system: this._patternSystemPrompt(),
        maxTokens: 800,
        type: 'pattern',
      });
      base.causation_synthesis = raw;
    }

    return base;
  }

  _patternSummaryForAI(base) {
    return [
      `Entry count: ${base.entry_count}, Days active: ${base.days_active}`,
      `Dominant domains: ${base.dominant_domains.join(', ')}`,
      `Rising: ${base.trending.rising.join(', ') || 'none'}`,
      `Falling: ${base.trending.falling.join(', ') || 'none'}`,
      `Co-activation clusters: ${base.co_activation_clusters.map(c => c.domains.join('+') + `(${c.strength})`).join(', ') || 'none yet'}`,
      `Archetype arc: ${base.archetype_arc.join(' → ') || 'none yet'}`,
      `Top blindspot: ${base.blindspot_frequency[0]?.pattern || 'none yet'}`,
    ].join('\n');
  }

  async generateIdealSelf() {
    if (this.memory.entries.length < 3) throw new Error('At least 3 decoded entries required.');
    const raw = await this._callClaude({
      messages: [{ role: 'user', content: `Full timeline data:\n${this.memory.getFullSummary()}\n\nSynthesize the complete ideal self portrait.` }],
      system: this._idealSelfSystemPrompt(),
      maxTokens: 1800,
    });
    const portrait = { ...raw, generated_at: new Date().toISOString() };
    this.memory.setIdealSelf(portrait);
    return portrait;
  }

  async synthesizeVersion({ weekLabel, entryIds } = {}) {
    let subset;
    if (entryIds?.length) subset = this.memory.entries.filter(e => entryIds.includes(e.id));
    else if (weekLabel) subset = this.memory.entries.filter(e => this._weekOf(e.timestamp) === weekLabel);
    else subset = this.memory.entries.slice(0, 10);
    if (!subset.length) throw new Error('No entries found for the given filter.');

    const wk = weekLabel || this._weekOf(subset[0].timestamp);
    const entryData = subset.map(e => {
      const dec = e.decoded || {};
      return `[${e.primary_domain}] ${(e.content || e.url || '(media)').slice(0, 60)}: causation="${dec.causation || ''}", duality="${dec.duality || ''}"`;
    }).join('\n');

    const raw = await this._callClaude({
      messages: [{ role: 'user', content: `Entries from ${wk}:\n${entryData}\n\nSynthesize this version snapshot.` }],
      system: this._versionSystemPrompt(),
      maxTokens: 600,
    });
    const version = { ...raw, week_label: wk, entry_count: subset.length, synthesized_at: new Date().toISOString() };
    this.memory.addVersion(version);
    return version;
  }

  getTimeline() { return this.memory.entries; }
  getVersions() { return this.memory.versions; }
  getIdealSelf() { return this.memory.idealSelf; }
  getMeta() { return this.memory.meta; }
  getDomainHeat() { return this.memory.meta.domain_heat; }

  getEntriesByDomain(domain) {
    if (!DOMAINS.includes(domain)) throw new Error(`domain must be one of: ${DOMAINS.join(', ')}`);
    return this.memory.entries.filter(e =>
      e.primary_domain === domain || (e.decoded?.domains || []).includes(domain)
    );
  }

  async _callClaude({ messages, system, maxTokens = 1500, type = 'decode' }) {
    if (this.demoMode) return this._mockResponse(type, messages);
    const response = await this.client.messages.create({
      model: 'claude-opus-4-5', max_tokens: maxTokens, system, messages,
    });
    let text = response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(text);
  }

  _mockResponse(type, messages) {
    const userText = messages?.[0]?.content || '';
    const domainMatch = userText.match(/PRIMARY DOMAIN: (\w+)/);
    const primaryDomain = domainMatch?.[1] || 'mental';

    if (type === 'pattern') {
      return {
        causation_narrative: 'Demo mode: Across your inputs, a consistent engine of deferred identity is visible — awareness accumulating without the permission to act. The subconscious is building a case for a version of you that hasn\'t been fully inhabited yet.',
        dominant_loop: 'Insight loop — you generate clarity, then circle back to generating more clarity instead of converting it to action.',
        co_activation_labels: [
          { domains: ['mental', 'identity'], label: 'The Analysis Mirror', meaning: 'You most often engage identity through cognitive analysis rather than embodied experience.' },
          { domains: ['shadow', 'emotional'], label: 'The Suppression Current', meaning: 'Emotional data is being routed through shadow — felt but not expressed.' },
        ],
        trend_interpretation: 'Demo mode: Rising domains suggest increasing urgency around purpose and identity. Falling social scores may indicate intentional withdrawal to focus on internal work.',
        next_unlock: 'Converting one insight per week into a single irreversible action — not a plan, an action.',
      };
    }

    if (type === 'ideal') {
      return {
        _demo: true,
        declaration: 'I am the architect of my own becoming, building with intention what others only imagine.',
        core_identity: 'A person of deep awareness at the threshold between reflection and action.',
        mission: 'To turn subconscious intelligence into lived identity, one deliberate move at a time.',
        dominant_pattern: 'Awareness without embodiment.',
        collective_blindspot: 'Preparation as a substitute for permission.',
        duality_resolution: 'The tension resolves through one committed action, not more clarity.',
        foundation_pillars: ['Radical self-honesty', 'Action as identity', 'Pattern interruption', 'Embodied vision'],
        action_roadmap: DOMAINS.slice(0, 6).map(d => ({ domain: d, action: `Take one irreversible step in the ${d} domain this week.`, why: `Your ${d} patterns are most ready for a breakthrough.` })),
        ideal_domain_scores: Object.fromEntries(DOMAINS.map(d => [d, 9])),
        current_domain_scores: Object.fromEntries(DOMAINS.map(d => [d, Math.floor(Math.random() * 5) + 3])),
        evolution_path: 'From observer to actor — the arc bends toward embodiment.',
        next_threshold: 'Committing to one identity-level action before feeling fully ready.',
      };
    }

    if (type === 'version') {
      return {
        _demo: true,
        version: this.memory.meta.current_version || '1.0',
        archetype: 'The Awakening Builder',
        summary: 'This period marks accelerating self-awareness paired with emerging action.',
        dominant_domain: primaryDomain,
        growth_edge: 'Translating insight into identity-level behavior.',
        shadow_edge: 'Using reflection as a substitute for commitment.',
      };
    }

    // Decode mock — score all 20 domains
    const scores = Object.fromEntries(DOMAINS.map(d => [
      d, d === primaryDomain ? 8 : Math.floor(Math.random() * 6) + 1
    ]));
    const activeDomains = Object.entries(scores).filter(([, v]) => v > 2).map(([k]) => k);
    const [major, minor] = (this.memory.meta.current_version || '0.0').split('.').map(Number);
    const nextVersion = `${major}.${(minor || 0) + 1}`;

    return {
      _demo: true,
      causation: `This input reveals a subconscious loop between identity and action in the ${primaryDomain} domain — awareness accumulated but not yet converted into a defining move.`,
      past_echo: 'An earlier version that gathered knowledge as a way of feeling ready, while deferring the commitment that would make readiness irrelevant.',
      blindspot: 'The accumulation of awareness is being mistaken for progress. The real work begins after the insight.',
      action: `Today, take one concrete step in the ${primaryDomain} domain that your current self would consider premature.`,
      foundation_piece: 'The awareness of the pattern is itself the first stone. What you see clearly, you can finally change.',
      self_version: nextVersion,
      archetype: 'The Awakening Builder',
      archetype_reason: 'You are in the charged phase between knowing and doing — gathering inner architecture before the first real move.',
      timeline_label: 'The Moment Before the Leap',
      domains: activeDomains,
      domain_scores: scores,
      intensity: 7,
      duality: 'The tension between the version of you who already knows what to do and the one still waiting for permission.',
    };
  }

  _weekOf(iso) {
    const d = new Date(iso);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
  }

  _decodeSystemPrompt() {
    const domainList = DOMAINS.map(d => `- ${d}: ${DOMAIN_DESCRIPTIONS[d]}`).join('\n');
    return `You are Subcode Decode — a subconscious archaeology and identity-architecture engine.

You receive personal inputs and decode them simultaneously across ALL 20 domains of human experience:

${domainList}

Score every domain 0–10 based on how strongly this input activates it. Most inputs will activate 5–12 domains meaningfully.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${DECODE_SCHEMA}

Rules:
- domain_scores: score ALL 20 domains (0 = not activated, 10 = core theme)
- domains: list all domains with score > 0
- self_version: continue from history (major = identity shift, minor = evolution), start at 1.0
- intensity: overall intensity 1–10
- All fields required. Be precise and psychologically penetrating.
- Speak like Carl Jung, a systems analyst, and a life architect combined.`;
  }

  _idealSelfSystemPrompt() {
    return `You are Subcode Decode's synthesis engine.

Given a person's complete decoded timeline across 20 domains, synthesize their complete ideal self portrait.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${IDEAL_SELF_SCHEMA}

Rules:
- Score all 20 domains in both ideal_domain_scores and current_domain_scores
- foundation_pillars: powerful, specific phrases — not generic
- action_roadmap: 5–7 items, concrete and specific
- All fields required. Be piercing and architecturally precise.`;
  }

  _versionSystemPrompt() {
    return `You are Subcode Decode's version synthesis engine.

Given decoded entries from a specific time period, synthesize a version snapshot.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${VERSION_SCHEMA}

Rules:
- Be specific to the actual data — not generic
- growth_edge and shadow_edge must be derived from the entries`;
  }

  _patternSystemPrompt() {
    return `You are Subcode Decode's pattern synthesis engine.

Given algorithmic pattern data from a person's decoded timeline, provide the deep interpretive layer — the named patterns, causation narrative, and next unlock.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${PATTERN_SYNTHESIS_SCHEMA}

Rules:
- Be specific to the actual pattern data provided — never generic
- co_activation_labels: only label pairs that were actually detected (may be empty array)
- next_unlock: one precise, specific intervention — not a general principle`;
  }
}

// ─── RESPONSE FORMATTER ───────────────────────────────────────────────────────

export class DecodeFormatter {
  static entryToApiResponse(entry) {
    const dec = entry.decoded || {};
    return {
      id: entry.id, timestamp: entry.timestamp,
      input_type: entry.input_type, primary_domain: entry.primary_domain,
      self_version: entry.self_version, archetype: entry.archetype,
      timeline_label: dec.timeline_label, intensity: dec.intensity,
      analysis: {
        causation: dec.causation, past_echo: dec.past_echo,
        blindspot: dec.blindspot, duality: dec.duality,
        action: dec.action, foundation_piece: dec.foundation_piece,
      },
      domains_activated: dec.domains || [],
      domain_scores: dec.domain_scores || {},
      _demo: dec._demo || false,
    };
  }

  static portraitToApiResponse(portrait) {
    const idealScores = portrait.ideal_domain_scores || {};
    const currentScores = portrait.current_domain_scores || {};
    return {
      generated_at: portrait.generated_at,
      identity: { declaration: portrait.declaration, core_identity: portrait.core_identity, mission: portrait.mission },
      patterns: {
        dominant_pattern: portrait.dominant_pattern, collective_blindspot: portrait.collective_blindspot,
        duality_resolution: portrait.duality_resolution, evolution_path: portrait.evolution_path,
        next_threshold: portrait.next_threshold,
      },
      foundation_pillars: portrait.foundation_pillars || [],
      action_roadmap: portrait.action_roadmap || [],
      domain_analysis: {
        current: currentScores, ideal: idealScores,
        gaps: Object.fromEntries(DOMAINS.map(d => [d, (idealScores[d] || 0) - (currentScores[d] || 0)])),
      },
      _demo: portrait._demo || false,
    };
  }

  static versionToApiResponse(version) {
    return {
      version: version.version, archetype: version.archetype, week_label: version.week_label,
      summary: version.summary, dominant_domain: version.dominant_domain,
      growth_edge: version.growth_edge, shadow_edge: version.shadow_edge,
      entry_count: version.entry_count, synthesized_at: version.synthesized_at,
    };
  }

  static patternsToApiResponse(patterns) {
    return {
      confidence: patterns.confidence,
      confidence_label: patterns.confidence_label,
      entry_count: patterns.entry_count,
      days_active: patterns.days_active,
      dominant_domains: patterns.dominant_domains,
      domain_averages: patterns.domain_averages,
      co_activation_clusters: patterns.co_activation_clusters,
      trending: patterns.trending,
      archetype_arc: patterns.archetype_arc,
      intensity_distribution: patterns.intensity_distribution,
      blindspot_frequency: patterns.blindspot_frequency,
      causation_synthesis: patterns.causation_synthesis,
    };
  }
}
