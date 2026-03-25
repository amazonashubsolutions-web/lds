import DestinationCard from "./DestinationCard";

export default function PopularDestinations({ items }) {
  return (
    <section className="popular-strip">
      <div className="popular-strip-head">
        <h2>Destinos Populares</h2>
        <div className="popular-strip-line" aria-hidden="true"></div>
        <button
          className="popular-strip-arrow"
          type="button"
          aria-label="Next destinations"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="popular-strip-list">
        {items.map((item) => (
          <DestinationCard
            key={`${item.title}-${item.subtitle}`}
            destination={item}
          />
        ))}
      </div>
    </section>
  );
}
