export default function ProductTravelNotes({
  considerations = [],
  cancellationPolicies = [],
}) {
  if (!considerations.length && !cancellationPolicies.length) {
    return null;
  }

  return (
    <section className="detalle-producto-section detalle-producto-section--surface">
      {considerations.length ? (
        <div className="detalle-producto-notes-block">
          <div className="detalle-producto-section-head">
            <h2>Para tener en cuenta</h2>
          </div>

          <ul className="detalle-producto-notes-list">
            {considerations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {cancellationPolicies.length ? (
        <div className="detalle-producto-notes-block">
          <div className="detalle-producto-section-head">
            <h2>Politicas de cancelacion</h2>
          </div>

          <ul className="detalle-producto-notes-list">
            {cancellationPolicies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
