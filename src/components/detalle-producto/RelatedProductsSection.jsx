import RelatedProductCard from "./RelatedProductCard";

export default function RelatedProductsSection({ items }) {
  return (
    <section className="detalle-producto-related">
      <div className="detalle-producto-related-head">
        <div>
          <h2>Continua tu viaje</h2>
          <p>Opciones relacionadas con este destino y tipo de experiencia.</p>
        </div>
      </div>

      <div className="detalle-producto-related-grid">
        {items.map((item) => (
          <RelatedProductCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
