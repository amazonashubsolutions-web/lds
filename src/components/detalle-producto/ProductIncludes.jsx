export default function ProductIncludes({ items }) {
  return (
    <section className="detalle-producto-section detalle-producto-section--surface">
      <div className="detalle-producto-section-head">
        <h2>Que incluye</h2>
      </div>

      <div className="detalle-producto-includes">
        {items.map((item) => (
          <article className="detalle-producto-include" key={item.title}>
            <div className="detalle-producto-include-check" aria-hidden="true">
              ✓
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
