export default function ProductGallery({ title, images }) {
  return (
    <section className="detalle-producto-gallery">
      <div className="detalle-producto-gallery-main">
        <img alt={title} src={images[0]} />
      </div>

      <div className="detalle-producto-gallery-grid">
        {images.slice(1).map((image, index) => (
          <div className="detalle-producto-gallery-item" key={image}>
            <img alt={`${title} vista ${index + 2}`} src={image} />
          </div>
        ))}
      </div>
    </section>
  );
}
