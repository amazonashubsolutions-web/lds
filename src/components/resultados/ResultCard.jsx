import { Link } from "react-router-dom";

export default function ResultCard({ item }) {
  return (
    <article className="result-card">
      <div className="result-card-media">
        <img alt={item.title} src={item.image} />
        <div className="result-card-rating">{item.rating.toFixed(1)} ★</div>
        {item.featured ? <div className="result-card-badge">Featured</div> : null}
      </div>

      <div className="result-card-body">
        <div className="result-card-head">
          <h3>{item.title}</h3>
          <button className="result-card-favorite" type="button" aria-label="Guardar">
            ♥
          </button>
        </div>

        <p className="result-card-location">{item.location}</p>

        <div className="result-card-footer">
          <div className="result-card-price">
            <span>Starting from</span>
            <strong>
              ${item.price} <em>/ night</em>
            </strong>
          </div>

          <Link className="result-card-cta" to={`/detalle-producto/${item.id}`}>
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
