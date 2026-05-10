import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const DOMAINS = [
  'emotional', 'spiritual', 'physical',
  'financial', 'creative', 'social', 'mental',
];

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
  "domains": ["array of all implicated domain ids"],
  "domain_scores": {
    "emotional": 0, "spiritual": 0, "physical": 0,
    "financial": 0, "creative": 0, "social": 0, "mental": 0
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
  "ideal_domain_scores": { "emotional": 0, "spiritual": 0, "physical": 0, "financial": 0, "creative": 0, "social": 0, "mental": 0 },
  "current_domain_scores": { "emotional": 0, "spiritual": 0, "physical": 0, "financial": 0, "creative": 0, "social": 0, "mental": 0 },
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

// ── Memory Store ──────────────────────────────────────────────────────────────

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

  addVersion(version) {
    this._data.versions.push(version);
    this.save();
  }

  setIdealSelf(portrait) {
    this._data.ideal_self = portrait;
    this.save();
  }

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
      ? '\n\nVERSION HISTORY:\n' + versionLines.join('\n')
      : '');
  }
}

// ── SubcodeDecode Engine ──────────────────────────────────────────────────────

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
    textParts.push('\nDecode this input. Trace it to a past version of this person. Continue version numbering from history.');

    const raw = await this._callClaude({
      messages: [{ role: 'user', content: textParts.join('\n') }],
      system: this._decodeSystemPrompt(),
      maxTokens: 1200,
    });

    const entry = {
      id, timestamp: ts, input_type: inputType, primary_domain: primaryDomain,
      content: content || null, url: url || null, notes: notes || null,
      self_version: raw.self_version, archetype: raw.archetype, decoded: raw,
    };

    this.memory.addEntry(entry);
    return entry;
  }

  async generateIdealSelf() {
    if (this.memory.entries.length < 3) {
      throw new Error('At least 3 decoded entries required.');
    }
    const raw = await this._callClaude({
      messages: [{
        role: 'user',
        content: `Full timeline data:\n${this.memory.getFullSummary()}\n\nSynthesize the complete ideal self portrait.`,
      }],
      system: this._idealSelfSystemPrompt(),
      maxTokens: 1600,
    });
    const portrait = { ...raw, generated_at: new Date().toISOString() };
    this.memory.setIdealSelf(portrait);
    return portrait;
  }

  async synthesizeVersion({ weekLabel, entryIds } = {}) {
    let subset;
    if (entryIds?.length) {
      subset = this.memory.entries.filter(e => entryIds.includes(e.id));
    } else if (weekLabel) {
      subset = this.memory.entries.filter(e => this._weekOf(e.timestamp) === weekLabel);
    } else {
      subset = this.memory.entries.slice(0, 10);
    }
    if (!subset.length) throw new Error('No entries found for the given filter.');

    const wk = weekLabel || this._weekOf(subset[0].timestamp);
    const entryData = subset.map(e => {
      const dec = e.decoded || {};
      const label = (e.content || e.url || '(media)').slice(0, 60);
      return `[${e.primary_domain}] ${label}: causation="${dec.causation || ''}", duality="${dec.duality || ''}"`;
    }).join('\n');

    const raw = await this._callClaude({
      messages: [{
        role: 'user',
        content: `Entries from ${wk}:\n${entryData}\n\nSynthesize this version snapshot.`,
      }],
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

  async _callClaude({ messages, system, maxTokens = 1200 }) {
    if (this.demoMode) return this._mockResponse(system, messages);

    const response = await this.client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      system,
      messages,
    });
    let text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    return JSON.parse(text);
  }

  _mockResponse(system, messages) {
    const userText = messages?.[0]?.content || '';
    const domainMatch = userText.match(/PRIMARY DOMAIN: (\w+)/);
    const primaryDomain = domainMatch?.[1] || 'mental';

    // Tilt scores so primaryDomain is highest
    const scores = Object.fromEntries(DOMAINS.map(d => [d, d === primaryDomain ? 8 : Math.floor(Math.random() * 5) + 1]));
    const activeDomains = Object.entries(scores).filter(([, v]) => v > 0).map(([k]) => k);

    // Detect which schema is expected from the system prompt
    if (system.includes('ideal self portrait')) {
      return {
        _demo: true,
        declaration: 'I am the architect of my own becoming, building with intention what others only imagine.',
        core_identity: 'A person of deep awareness standing at the threshold between reflection and action. You sense patterns others miss and hold visions others abandon. The gap you feel is not failure — it is the charged space before transformation.',
        mission: 'To turn subconscious intelligence into lived identity, one deliberate move at a time.',
        dominant_pattern: 'Awareness without embodiment — you consistently perceive what needs to change before you allow yourself to change it.',
        collective_blindspot: 'The belief that more preparation precedes permission to begin.',
        duality_resolution: 'The tension between who you know yourself to be and who you currently act as resolves through one committed action, not through more clarity.',
        foundation_pillars: ['Radical self-honesty', 'Action as identity', 'Pattern interruption', 'Embodied vision', 'Deliberate evolution'],
        action_roadmap: DOMAINS.slice(0, 6).map(d => ({
          domain: d,
          action: `Take one irreversible step in the ${d} domain this week.`,
          why: `Your ${d} patterns are the most activated and most ready for a breakthrough.`,
        })),
        ideal_domain_scores: Object.fromEntries(DOMAINS.map(d => [d, 9])),
        current_domain_scores: scores,
        evolution_path: 'You have been the observer. You are becoming the actor. The arc bends from analysis toward embodiment — from knowing the map to walking the territory.',
        next_threshold: 'Committing to one identity-level action before you feel fully ready.',
      };
    }

    if (system.includes('version snapshot')) {
      const currentVersion = this.memory.meta.current_version || '1.0';
      return {
        _demo: true,
        version: currentVersion,
        archetype: 'The Awakening Builder',
        summary: 'This period marks a phase of accelerating self-awareness paired with emerging action. The person is crossing from observer to participant in their own evolution.',
        dominant_domain: primaryDomain,
        growth_edge: 'Translating accumulated insight into consistent, identity-level behavior.',
        shadow_edge: 'Using reflection as a substitute for commitment.',
      };
    }

    // Default: decode schema
    const versionHistory = this.memory.meta.current_version || '0.0';
    const [major, minor] = versionHistory.split('.').map(Number);
    const nextVersion = `${major}.${(minor || 0) + 1}`;

    return {
      _demo: true,
      causation: `This input reveals a subconscious loop between identity and action in the ${primaryDomain} domain — a pattern of accumulated awareness that has not yet been converted into a defining move.`,
      past_echo: 'This echoes an earlier version that gathered knowledge and insight as a way of feeling ready, while deferring the commitment that would make readiness irrelevant.',
      blindspot: 'The accumulation of awareness is being mistaken for progress. The real work begins after the insight.',
      action: `Today, take one concrete step in the ${primaryDomain} domain that your current self would consider premature.`,
      foundation_piece: 'The awareness of the pattern is itself the first stone. What you see clearly, you can finally change.',
      self_version: nextVersion,
      archetype: 'The Awakening Builder',
      archetype_reason: 'You are in the charged phase between knowing and doing — gathering the inner architecture before the first real move.',
      timeline_label: 'The Moment Before the Leap',
      domains: activeDomains,
      domain_scores: scores,
      intensity: 7,
      duality: `The tension between the version of you who already knows what to do and the version still waiting for permission to do it.`,
    };
  }

  _weekOf(iso) {
    const d = new Date(iso);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
  }

  _decodeSystemPrompt() {
    return `You are Subcode Decode — a subconscious archaeology and identity-architecture engine.

You receive personal inputs (text, URLs, notes) and decode them simultaneously across all 7 domains of human experience: emotional, spiritual, physical, financial, creative, social, and mental.

Your job is to surface the subconscious code embedded in each input — the causation patterns, past echoes, dualities, blind spots, and foundation pieces that together build a picture of who this person is and who they are becoming.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${DECODE_SCHEMA}

Rules:
- domain_scores: score each domain 0–10 based on activation strength
- domains: list all domains with score > 0
- self_version: continue from history (major = identity shift, minor = evolution), start at 1.0
- intensity: overall intensity 1–10
- All fields required. Be precise and psychologically penetrating.
- Speak like a synthesis of Carl Jung, a systems analyst, and a life architect.`;
  }

  _idealSelfSystemPrompt() {
    return `You are Subcode Decode's synthesis engine.

Given a person's complete decoded timeline, synthesize their complete ideal self portrait. This is a precise, personalized blueprint derived from their actual inputs — not generic self-help.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${IDEAL_SELF_SCHEMA}

Rules:
- ideal_domain_scores: where they are headed (0–10)
- current_domain_scores: where they actually are now (0–10)
- foundation_pillars: powerful, specific phrases — not generic
- action_roadmap: 5–7 items, one per most-activated domain, concrete and specific
- All fields required. Be piercing and architecturally precise.`;
  }

  _versionSystemPrompt() {
    return `You are Subcode Decode's version synthesis engine.

Given decoded entries from a specific time period, synthesize a version snapshot capturing who this person was during that period.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

${VERSION_SCHEMA}

Rules:
- version: use the mode or latest self_version from entries
- Be specific to the actual data — not generic
- growth_edge and shadow_edge must be derived from the entries`;
  }
}

// ── Response Formatter ────────────────────────────────────────────────────────

export class DecodeFormatter {
  static entryToApiResponse(entry) {
    const dec = entry.decoded || {};
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      input_type: entry.input_type,
      primary_domain: entry.primary_domain,
      self_version: entry.self_version,
      archetype: entry.archetype,
      timeline_label: dec.timeline_label,
      intensity: dec.intensity,
      analysis: {
        causation: dec.causation,
        past_echo: dec.past_echo,
        blindspot: dec.blindspot,
        duality: dec.duality,
        action: dec.action,
        foundation_piece: dec.foundation_piece,
      },
      domains_activated: dec.domains || [],
      domain_scores: dec.domain_scores || {},
    };
  }

  static portraitToApiResponse(portrait) {
    const idealScores = portrait.ideal_domain_scores || {};
    const currentScores = portrait.current_domain_scores || {};
    return {
      generated_at: portrait.generated_at,
      identity: {
        declaration: portrait.declaration,
        core_identity: portrait.core_identity,
        mission: portrait.mission,
      },
      patterns: {
        dominant_pattern: portrait.dominant_pattern,
        collective_blindspot: portrait.collective_blindspot,
        duality_resolution: portrait.duality_resolution,
        evolution_path: portrait.evolution_path,
        next_threshold: portrait.next_threshold,
      },
      foundation_pillars: portrait.foundation_pillars || [],
      action_roadmap: portrait.action_roadmap || [],
      domain_analysis: {
        current: currentScores,
        ideal: idealScores,
        gaps: Object.fromEntries(DOMAINS.map(d => [d, (idealScores[d] || 0) - (currentScores[d] || 0)])),
      },
    };
  }

  static versionToApiResponse(version) {
    return {
      version: version.version,
      archetype: version.archetype,
      week_label: version.week_label,
      summary: version.summary,
      dominant_domain: version.dominant_domain,
      growth_edge: version.growth_edge,
      shadow_edge: version.shadow_edge,
      entry_count: version.entry_count,
      synthesized_at: version.synthesized_at,
    };
  }
}
