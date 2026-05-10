export default function Home() {
  const isDemo = !process.env.ANTHROPIC_API_KEY;

  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '640px' }}>
      <h1>Subcode Decode API</h1>
      <p>Personal Input Decoder — 7 subconscious domains powered by Claude AI.</p>

      {isDemo && (
        <div style={{
          background: '#fffbea',
          border: '1px solid #f0c040',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          margin: '1rem 0',
          fontSize: '0.9rem',
        }}>
          ⚠️ <strong>Demo mode</strong> — responses are illustrative mock data.
          Add <code>ANTHROPIC_API_KEY</code> in Vercel environment variables to enable real AI.
        </div>
      )}

      <h2>Endpoints</h2>
      <ul>
        <li><code>POST /api/decode</code> — Decode an input</li>
        <li><code>POST /api/ideal-self</code> — Generate ideal self portrait</li>
        <li><code>POST /api/version</code> — Synthesize a version snapshot</li>
        <li><code>GET /api/timeline</code> — All decoded entries</li>
        <li><code>GET /api/meta</code> — Stats &amp; domain heat</li>
        <li><code>GET /api/domain-heat</code> — Domain activity counts</li>
        <li><code>GET /api/domain/[name]</code> — Entries by domain</li>
      </ul>

      <h2>Domains</h2>
      <p>emotional · spiritual · physical · financial · creative · social · mental</p>
    </main>
  );
}
