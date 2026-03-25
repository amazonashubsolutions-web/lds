export default function ProductReviews({ items }) {
  return (
    <section className="detalle-producto-section detalle-producto-section--bordered">
      <div className="detalle-producto-section-head detalle-producto-section-head--row">
        <h2>Resenas de viajeros</h2>
        <button className="detalle-producto-link-button" type="button">
          Escribir resena
        </button>
      </div>

      <div className="detalle-producto-reviews">
        {items.map((item) => (
          <article className="detalle-producto-review" key={item.author}>
            <div className="detalle-producto-review-avatar">{item.initials}</div>
            <div className="detalle-producto-review-body">
              <div className="detalle-producto-review-head">
                <strong>{item.author}</strong>
                <span>{item.meta}</span>
              </div>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
