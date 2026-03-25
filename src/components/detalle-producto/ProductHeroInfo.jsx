function ProductMeta({ items }) {
  return (
    <div className="detalle-producto-meta">
      {items.map((item) => (
        <div className="detalle-producto-meta-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function ProductHeroInfo({ detail }) {
  return (
    <section className="detalle-producto-hero-info">
      <div className="detalle-producto-badges">
        <span className="detalle-producto-badge">{detail.eyebrow}</span>
        <div className="detalle-producto-rating">
          <strong>{detail.rating.toFixed(1)}</strong>
          <span>{detail.reviewsCount} resenas</span>
        </div>
      </div>

      <h1>{detail.title}</h1>

      <div className="detalle-producto-location">{detail.location}</div>

      <p className="detalle-producto-summary">{detail.summary}</p>

      <ProductMeta items={detail.meta} />
    </section>
  );
}
