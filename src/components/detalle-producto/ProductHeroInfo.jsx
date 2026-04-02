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

export default function ProductHeroInfo({ detail, showBadges = true }) {
  return (
    <section className="detalle-producto-hero-info">
      {showBadges ? (
        <div className="detalle-producto-badges">
          <span className="detalle-producto-badge">{detail.eyebrow}</span>
        </div>
      ) : null}

      <h1>{detail.title}</h1>

      <div className="detalle-producto-location">{detail.location}</div>

      <p className="detalle-producto-summary">{detail.summary}</p>

      <ProductMeta items={detail.meta} />
    </section>
  );
}
