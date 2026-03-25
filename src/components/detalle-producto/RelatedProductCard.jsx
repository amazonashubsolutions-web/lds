import { Link } from "react-router-dom";

export default function RelatedProductCard({ item }) {
  return (
    <article className="detalle-producto-related-card">
      <img alt={item.title} src={item.image} />
      <div className="detalle-producto-related-body">
        <h3>{item.title}</h3>
        <p>{item.location}</p>
        <Link className="detalle-producto-related-link" to={`/detalle-producto/${item.id}`}>
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
