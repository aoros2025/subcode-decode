export default function Home() {
  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '640px' }}>
      <h1>Subcode Decode API</h1>
      <p>Personal Input Decoder — 7 subconscious domains powered by Claude AI.</p>
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
