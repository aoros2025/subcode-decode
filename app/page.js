'use client';

import { useState } from 'react';

const DOMAINS = [
  'emotional', 'spiritual', 'physical', 'financial', 'creative', 'social', 'mental',
  'identity', 'purpose', 'relationships', 'career', 'habits', 'shadow',
  'time', 'power', 'communication', 'environment', 'abundance', 'growth', 'body',
];

const DOMAIN_COLORS = {
  emotional:     '#e07070',
  spiritual:     '#a070e0',
  physical:      '#40b080',
  financial:     '#f0a030',
  creative:      '#40a0f0',
  social:        '#f06040',
  mental:        '#8060c0',
  identity:      '#e060b0',
  purpose:       '#f0c040',
  relationships: '#e08040',
  career:        '#60b0d0',
  habits:        '#90b040',
  shadow:        '#606080',
  time:          '#40c0c0',
  power:         '#d04040',
  communication: '#70c090',
  environment:   '#60a060',
  abundance:     '#d0a060',
  growth:        '#80d080',
  body:          '#e09090',
};

export default function Home() {
  const [content, setContent] = useState('');
  const [domain, setDomain] = useState('mental');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('decode');
  const [timeline, setTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  async function handleDecode() {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, primary_domain: domain, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeline() {
    setLoadingTimeline(true);
    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();
      setTimeline(data.entries || []);
    } catch {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  }

  async function handlePatterns() {
    setLoadingPatterns(true);
    try {
      const res = await fetch('/api/patterns');
      const data = await res.json();
      setPatterns(data);
    } catch {
      setPatterns(null);
    } finally {
      setLoadingPatterns(false);
    }
  }

  const TABS = ['decode', 'timeline', 'patterns'];

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
            Subcode Decode
          </h1>
          <p style={{ color: '#888', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Personal input decoder — 20 subconscious domains
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #222' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === 'timeline') handleTimeline();
                if (t === 'patterns') handlePatterns();
              }}
              style={{
                background: 'none', border: 'none', color: tab === t ? '#fff' : '#666',
                fontWeight: tab === t ? 600 : 400, fontSize: '0.95rem', padding: '0.5rem 0',
                borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer', textTransform: 'capitalize', marginBottom: '-1px',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Decode Tab */}
        {tab === 'decode' && (
          <div>
            {/* Domain selector */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Primary Domain
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {DOMAINS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    style={{
                      padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem',
                      border: domain === d ? `1.5px solid ${DOMAIN_COLORS[d]}` : '1.5px solid #2a2a2a',
                      background: domain === d ? `${DOMAIN_COLORS[d]}22` : 'transparent',
                      color: domain === d ? DOMAIN_COLORS[d] : '#666',
                      cursor: 'pointer', fontWeight: domain === d ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Content input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                What do you want to decode?
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="A thought, pattern, memory, habit, recurring feeling — anything you want to understand at a deeper level…"
                rows={5}
                style={{
                  width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px',
                  color: '#e8e8f0', padding: '0.85rem 1rem', fontSize: '0.95rem', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#444'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            {/* Notes input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Context / Notes <span style={{ color: '#555' }}>(optional)</span>
              </label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Why is this significant to you right now?"
                style={{
                  width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px',
                  color: '#e8e8f0', padding: '0.75rem 1rem', fontSize: '0.95rem',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#444'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleDecode}
              disabled={loading || !content.trim()}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '10px', fontSize: '1rem',
                fontWeight: 600, border: 'none', cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
                background: loading || !content.trim() ? '#1a1a1a' : '#fff',
                color: loading || !content.trim() ? '#555' : '#000',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Decoding…' : 'Decode'}
            </button>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#1a0a0a', border: '1px solid #500', borderRadius: '10px', color: '#f88', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            {result && <DecodeResult result={result} />}
          </div>
        )}

        {/* Timeline Tab */}
        {tab === 'timeline' && (
          <div>
            {loadingTimeline && <p style={{ color: '#666' }}>Loading…</p>}
            {timeline && timeline.length === 0 && (
              <p style={{ color: '#666' }}>No entries yet. Decode something first.</p>
            )}
            {timeline && timeline.length > 0 && <TimelineView entries={timeline} />}
          </div>
        )}

        {/* Patterns Tab */}
        {tab === 'patterns' && (
          <div>
            {loadingPatterns && <p style={{ color: '#666' }}>Analyzing patterns…</p>}
            {patterns && <PatternsView patterns={patterns} />}
          </div>
        )}
      </div>
    </main>
  );
}

function TimelineView({ entries }) {
  const [expanded, setExpanded] = useState(null);

  // Group entries by calendar date, newest first
  const groups = [];
  const seen = {};
  // entries are newest-first from API
  entries.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    if (!seen[date]) { seen[date] = true; groups.push({ date, entries: [] }); }
    groups[groups.length - 1].entries.push(entry);
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical spine */}
      <div style={{
        position: 'absolute', left: '11px', top: '8px', bottom: 0,
        width: '2px', background: 'linear-gradient(to bottom, #2a2a40, #1a1a2a 80%, transparent)',
        borderRadius: '1px',
      }} />

      {groups.map(({ date, entries: dayEntries }) => (
        <div key={date} style={{ marginBottom: '2rem' }}>
          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              background: '#0a0a0f', border: '2px solid #3a3a5a', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5050a0' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#5050a0', fontWeight: 600, letterSpacing: '0.04em' }}>
              {date}
            </span>
          </div>

          {/* Entries for this day */}
          {dayEntries.map(entry => {
            const dec = entry.decoded || {};
            const color = DOMAIN_COLORS[entry.primary_domain] || '#888';
            const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', hour12: true,
            });
            const isOpen = expanded === entry.id;
            const snippet = (entry.content || entry.url || '').slice(0, 100);

            return (
              <div key={entry.id} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', marginLeft: '0' }}>
                {/* Node */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: `${color}22`, border: `2px solid ${color}88`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
                  </div>
                </div>

                {/* Card */}
                <div
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  style={{
                    flex: 1, padding: '0.85rem 1rem', background: '#111',
                    border: `1px solid ${isOpen ? color + '44' : '#1e1e1e'}`,
                    borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.2s',
                    marginBottom: 0,
                  }}
                >
                  {/* Top row: time · version · domain · intensity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#444', fontVariantNumeric: 'tabular-nums' }}>{time}</span>
                    {entry.self_version && (
                      <span style={{
                        fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.1rem 0.4rem',
                        background: '#1a1a2a', border: '1px solid #2a2a40', borderRadius: '4px', color: '#6060a0',
                      }}>v{entry.self_version}</span>
                    )}
                    <DomainPill domain={entry.primary_domain} />
                    {dec.intensity && (
                      <IntensityBar intensity={dec.intensity} />
                    )}
                  </div>

                  {/* Identity: archetype */}
                  {entry.archetype && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc', fontStyle: 'italic', marginBottom: '0.3rem', fontWeight: 500 }}>
                      {entry.archetype}
                    </div>
                  )}

                  {/* Moment label */}
                  {dec.timeline_label && (
                    <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                      "{dec.timeline_label}"
                    </div>
                  )}

                  {/* Content snippet */}
                  {snippet && (
                    <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
                      {snippet}{(entry.content || '').length > 100 ? '…' : ''}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #1e1e1e', paddingTop: '1rem' }}>
                      {/* Domain scores — only activated ones */}
                      {dec.domain_scores && Object.keys(dec.domain_scores).length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Domain Activation</div>
                          {Object.entries(dec.domain_scores)
                            .filter(([, v]) => v > 0)
                            .sort(([, a], [, b]) => b - a)
                            .map(([d, score]) => (
                              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.72rem', color: '#555', width: '100px', flexShrink: 0 }}>{d}</span>
                                <div style={{ flex: 1, height: '3px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${score * 10}%`, background: DOMAIN_COLORS[d] || '#666', borderRadius: '2px' }} />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#444', width: '16px', textAlign: 'right' }}>{score}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {[
                        ['Causation', dec.causation],
                        ['Duality', dec.duality],
                        ['Blind Spot', dec.blindspot],
                        ['Past Echo', dec.past_echo],
                        ['Action Now', dec.action],
                        ['Foundation', dec.foundation_piece],
                      ].map(([label, value]) => value ? (
                        <div key={label} style={{ marginBottom: '0.85rem' }}>
                          <div style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{label}</div>
                          <div style={{ fontSize: '0.88rem', color: '#aaa', lineHeight: 1.6 }}>{value}</div>
                        </div>
                      ) : null)}
                    </div>
                  )}

                  {/* Expand hint */}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#333' }}>
                    {isOpen ? '↑ collapse' : '↓ expand'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function IntensityBar({ intensity }) {
  const filled = Math.round(intensity / 2); // 1–5 dots
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: '4px', height: '4px', borderRadius: '50%',
          background: i <= filled
            ? intensity >= 8 ? '#e07070' : intensity >= 5 ? '#d0a060' : '#6080a0'
            : '#222',
        }} />
      ))}
    </div>
  );
}

function DomainPill({ domain }) {
  const color = DOMAIN_COLORS[domain] || '#888';
  return (
    <span style={{
      fontSize: '0.72rem', padding: '0.15rem 0.6rem', borderRadius: '999px',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {domain}
    </span>
  );
}

function DecodeResult({ result }) {
  const demo = result._demo;
  const scores = result.domain_scores || {};

  return (
    <div style={{ marginTop: '2rem' }}>
      {demo && (
        <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: '#1a1500', border: '1px solid #443300', borderRadius: '8px', fontSize: '0.82rem', color: '#aa8800' }}>
          Demo mode — add <code>ANTHROPIC_API_KEY</code> in Vercel for real AI
        </div>
      )}

      {/* Version + Archetype */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {result.self_version && (
          <span style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' }}>v{result.self_version}</span>
        )}
        {result.archetype && (
          <span style={{ fontSize: '1rem', fontStyle: 'italic', color: '#ccc' }}>{result.archetype}</span>
        )}
        {result.intensity && (
          <span style={{ fontSize: '0.8rem', color: '#666' }}>intensity {result.intensity}/10</span>
        )}
      </div>

      {result.timeline_label && (
        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem', letterSpacing: '0.02em' }}>
          "{result.timeline_label}"
        </div>
      )}

      {/* Domain score bars — all 20 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Domain Activation</div>
        {Object.entries(scores).sort(([, a], [, b]) => b - a).map(([d, score]) => (
          score > 0 ? (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#666', width: '100px', flexShrink: 0 }}>{d}</span>
              <div style={{ flex: 1, height: '4px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score * 10}%`, background: DOMAIN_COLORS[d] || '#666', borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#555', width: '20px', textAlign: 'right' }}>{score}</span>
            </div>
          ) : null
        ))}
      </div>

      {/* Analysis fields */}
      {result.analysis && [
        ['Causation', result.analysis.causation],
        ['Duality', result.analysis.duality],
        ['Blind Spot', result.analysis.blindspot],
        ['Past Echo', result.analysis.past_echo],
        ['Action Now', result.analysis.action],
        ['Foundation', result.analysis.foundation_piece],
      ].map(([label, value]) => value ? (
        <div key={label} style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>{label}</div>
          <div style={{ fontSize: '0.95rem', color: '#ccc', lineHeight: 1.65 }}>{value}</div>
        </div>
      ) : null)}
    </div>
  );
}

function PatternsView({ patterns }) {
  const {
    confidence, confidence_label, entry_count, days_active,
    dominant_domains, domain_averages, co_activation_clusters,
    trending, archetype_arc, intensity_distribution,
    blindspot_frequency, causation_synthesis,
  } = patterns;

  const isEmpty = entry_count === 0;

  return (
    <div>
      {/* Confidence meter */}
      <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Pattern Confidence</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e8e8f0' }}>{confidence_label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{entry_count}</div>
            <div style={{ fontSize: '0.75rem', color: '#555' }}>entries · {days_active}d active</div>
          </div>
        </div>
        <div style={{ height: '6px', background: '#1e1e1e', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${confidence * 100}%`,
            background: confidence < 0.25 ? '#555' : confidence < 0.5 ? '#886030' : confidence < 0.75 ? '#60a080' : '#80c0ff',
            borderRadius: '3px', transition: 'width 0.6s ease',
          }} />
        </div>
        {isEmpty && (
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
            Decode your first input to begin building your pattern map. After 5+ entries, cross-domain causation loops will emerge. After 10+, trend patterns and co-activation clusters unlock.
          </div>
        )}
        {entry_count > 0 && entry_count < 5 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#555' }}>
            {5 - entry_count} more {5 - entry_count === 1 ? 'entry' : 'entries'} to unlock co-activation analysis · {Math.max(0, 10 - entry_count)} for trend patterns
          </div>
        )}
      </div>

      {!isEmpty && (
        <>
          {/* Domain heatmap */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Domain Heatmap (20 domains)</div>
            {Object.entries(domain_averages || {})
              .sort(([, a], [, b]) => b - a)
              .map(([d, avg]) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.75rem', width: '110px', flexShrink: 0,
                    color: (dominant_domains || []).includes(d) ? (DOMAIN_COLORS[d] || '#888') : '#555',
                    fontWeight: (dominant_domains || []).includes(d) ? 600 : 400,
                  }}>
                    {d}
                  </span>
                  <div style={{ flex: 1, height: '5px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${avg * 10}%`,
                      background: DOMAIN_COLORS[d] || '#555',
                      opacity: avg > 0 ? 0.7 + avg * 0.03 : 0.2,
                      borderRadius: '3px',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#444', width: '28px', textAlign: 'right' }}>
                    {avg > 0 ? avg.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
          </div>

          {/* Trending */}
          {(trending?.rising?.length > 0 || trending?.falling?.length > 0) && (
            <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#0d1a0d', border: '1px solid #1a2a1a', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#4a8a4a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Rising</div>
                {trending.rising.length > 0
                  ? trending.rising.map(d => <DomainPill key={d} domain={d} />)
                  : <span style={{ fontSize: '0.8rem', color: '#444' }}>None yet</span>}
              </div>
              <div style={{ padding: '1rem', background: '#1a0d0d', border: '1px solid #2a1a1a', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#8a4a4a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Falling</div>
                {trending.falling.length > 0
                  ? trending.falling.map(d => <DomainPill key={d} domain={d} />)
                  : <span style={{ fontSize: '0.8rem', color: '#444' }}>None yet</span>}
              </div>
            </div>
          )}

          {/* Co-activation clusters */}
          {co_activation_clusters?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Co-activation Clusters</div>
              {co_activation_clusters.map(({ domains, strength, label, meaning }, i) => (
                <div key={i} style={{ marginBottom: '0.6rem', padding: '0.85rem 1rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: label ? '0.35rem' : 0 }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {domains.map(d => <DomainPill key={d} domain={d} />)}
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#555' }}>{Math.round(strength * 100)}% co-active</span>
                  </div>
                  {label && <div style={{ fontSize: '0.82rem', color: '#aaa', fontStyle: 'italic' }}>{label}</div>}
                  {meaning && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem', lineHeight: 1.5 }}>{meaning}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Archetype arc */}
          {archetype_arc?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Archetype Arc</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                {archetype_arc.map((a, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#aaa', fontStyle: 'italic', padding: '0.2rem 0.6rem', background: '#181818', borderRadius: '6px' }}>{a}</span>
                    {i < archetype_arc.length - 1 && <span style={{ color: '#333', fontSize: '0.8rem' }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blindspot frequency */}
          {blindspot_frequency?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Recurring Blind Spots</div>
              {blindspot_frequency.map(({ pattern, count }, i) => (
                <div key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', color: '#555', flexShrink: 0, paddingTop: '0.15rem' }}>×{count}</span>
                  <span style={{ fontSize: '0.88rem', color: '#888', lineHeight: 1.5 }}>{pattern}</span>
                </div>
              ))}
            </div>
          )}

          {/* Intensity distribution */}
          {intensity_distribution && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Intensity Distribution</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { label: 'Low', key: 'low', color: '#4a7a4a' },
                  { label: 'Medium', key: 'medium', color: '#7a7a3a' },
                  { label: 'High', key: 'high', color: '#8a3a3a' },
                ].map(({ label, key, color }) => (
                  <div key={key} style={{ flex: 1, padding: '0.75rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{intensity_distribution[key] || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.2rem' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI causation synthesis */}
          {causation_synthesis && (
            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#0d0d1a', border: '1px solid #2a2a40', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: '#5050a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Pattern Synthesis</div>
              {causation_synthesis.causation_narrative && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#444', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core Engine</div>
                  <div style={{ fontSize: '0.92rem', color: '#ccc', lineHeight: 1.65 }}>{causation_synthesis.causation_narrative}</div>
                </div>
              )}
              {causation_synthesis.dominant_loop && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#444', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dominant Loop</div>
                  <div style={{ fontSize: '0.92rem', color: '#ccc', lineHeight: 1.65 }}>{causation_synthesis.dominant_loop}</div>
                </div>
              )}
              {causation_synthesis.trend_interpretation && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#444', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trend Read</div>
                  <div style={{ fontSize: '0.92rem', color: '#ccc', lineHeight: 1.65 }}>{causation_synthesis.trend_interpretation}</div>
                </div>
              )}
              {causation_synthesis.next_unlock && (
                <div style={{ padding: '0.85rem 1rem', background: '#111830', border: '1px solid #303060', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#5050a0', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Unlock</div>
                  <div style={{ fontSize: '0.92rem', color: '#b0b0e0', lineHeight: 1.65 }}>{causation_synthesis.next_unlock}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
