export default function ProductGallery({ title, images }) {
  const galleryItems = images.slice(1, 5);

  return (
    <section className="detalle-producto-gallery">
      <div className="detalle-producto-gallery-main">
        <img alt={title} src={images[0]} />
      </div>

      <div className="detalle-producto-gallery-grid">
        {galleryItems.map((image, index) => (
          <div className="detalle-producto-gallery-item" key={image}>
            <img alt={`${title} vista ${index + 2}`} src={image} />
          </div>
        ))}
      </div>
    </section>
  );
}
