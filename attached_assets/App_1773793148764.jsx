const nextFeeding = new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
});

export default function App() {
  return (
    <main className="page">
      <section className="card">
        <h1>SCADA Cat Feeder</h1>
        <p className="subtitle">Now running on Node + npm + React</p>
        <div className="stats">
          <article>
            <h2>Hopper Level</h2>
            <p>72%</p>
          </article>
          <article>
            <h2>Dispenser State</h2>
            <p>Ready</p>
          </article>
          <article>
            <h2>Next Feeding</h2>
            <p>{nextFeeding}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
