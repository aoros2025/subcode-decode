'use client';

import { useState } from 'react';

const DOMAINS = ['emotional', 'spiritual', 'physical', 'financial', 'creative', 'social', 'mental'];

const DOMAIN_COLORS = {
  emotional: '#e07',
  spiritual: '#70e',
  physical: '#0a8',
  financial: '#f80',
  creative: '#08f',
  social: '#f40',
  mental: '#60a',
};

export default function Home() {
  const [content, setContent] = useState('');
  const [domain, setDomain] = useState('mental');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('decode'); // 'decode' | 'timeline'
  const [timeline, setTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

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
    } catch (e) {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
            Subcode Decode
          </h1>
          <p style={{ color: '#888', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Personal input decoder — 7 subconscious domains
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #222' }}>
          {['decode', 'timeline'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === 'timeline') handleTimeline(); }}
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {DOMAINS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    style={{
                      padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem',
                      border: domain === d ? `1.5px solid ${DOMAIN_COLORS[d]}` : '1.5px solid #333',
                      background: domain === d ? `${DOMAIN_COLORS[d]}22` : 'transparent',
                      color: domain === d ? DOMAIN_COLORS[d] : '#888',
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
                  outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
                  fontFamily: 'inherit',
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

            {/* Result */}
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
            {timeline && timeline.map(entry => (
              <div key={entry.id} style={{
                marginBottom: '1rem', padding: '1rem 1.25rem',
                background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#555' }}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {entry.self_version && <span style={{ fontSize: '0.75rem', color: '#666' }}>v{entry.self_version}</span>}
                    <DomainPill domain={entry.primary_domain} />
                  </div>
                </div>
                {entry.archetype && <div style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic', marginBottom: '0.4rem' }}>{entry.archetype}</div>}
                <div style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5 }}>
                  {(entry.content || entry.url || '').slice(0, 120)}{(entry.content || '').length > 120 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
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
          ⚠ Demo mode — add <code>ANTHROPIC_API_KEY</code> in Vercel for real AI
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

      {/* Domain score bars */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Domain Activation</div>
        {Object.entries(scores).sort(([,a],[,b]) => b - a).map(([d, score]) => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#666', width: '72px', flexShrink: 0 }}>{d}</span>
            <div style={{ flex: 1, height: '4px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score * 10}%`, background: DOMAIN_COLORS[d] || '#666', borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#555', width: '20px', textAlign: 'right' }}>{score}</span>
          </div>
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
