export default function ProductOverview({ paragraphs }) {
  return (
    <section className="detalle-producto-section">
      <div className="detalle-producto-section-head">
        <h2>Descripcion general</h2>
      </div>

      <div className="detalle-producto-copy">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
