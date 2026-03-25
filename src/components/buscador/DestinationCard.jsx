export default function DestinationCard({ destination }) {
  return (
    <article className="destination-card">
      <div className="destination-card-media">
        <img alt={destination.title} src={destination.image} />
      </div>
      <div className="destination-card-content">
        <h3>{destination.title}</h3>
        <p>{destination.subtitle}</p>
      </div>
    </article>
  );
}
