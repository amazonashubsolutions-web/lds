import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function DestinationMediaSection({
  activeImageIndex,
  gallery,
  isGalleryModalOpen,
  onCloseGallery,
  onOpenGallery,
  onSetActiveImageIndex,
  sectionRef,
}) {
  const activeImage = gallery[activeImageIndex];

  useEffect(() => {
    if (!isGalleryModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseGallery();
      }

      if (event.key === "ArrowRight") {
        onSetActiveImageIndex((currentIndex) => (currentIndex + 1) % gallery.length);
      }

      if (event.key === "ArrowLeft") {
        onSetActiveImageIndex((currentIndex) =>
          currentIndex === 0 ? gallery.length - 1 : currentIndex - 1,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [gallery.length, isGalleryModalOpen, onCloseGallery, onSetActiveImageIndex]);

  const handlePrevious = () => {
    onSetActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? gallery.length - 1 : currentIndex - 1,
    );
  };

  const handleNext = () => {
    onSetActiveImageIndex((currentIndex) => (currentIndex + 1) % gallery.length);
  };

  return (
    <>
      <section
        className="destino-section destino-section--gallery destino-anchor-target"
        ref={sectionRef}
      >
        <div className="destino-shell">
          <div className="destino-section-heading destino-section-heading--light destino-section-heading--split">
            <div>
              <h2>Visualiza tu destino</h2>
              <p>Una composicion de rio, arquitectura y sabor para anticipar el viaje.</p>
            </div>
            <button
              className="destino-ghost-light destino-gallery-action"
              onClick={() => onOpenGallery(0)}
              type="button"
            >
              Ver galeria completa
            </button>
          </div>

          <div className="destino-gallery-grid">
            {gallery.map((item, index) => (
              <article
                key={item.alt}
                className={
                  index === 0
                    ? "destino-gallery-item destino-gallery-item--featured"
                    : "destino-gallery-item"
                }
              >
                <button
                  className="destino-gallery-trigger"
                  onClick={() => onOpenGallery(index)}
                  type="button"
                >
                  <img alt={item.alt} src={item.src} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isGalleryModalOpen
        ? createPortal(
            <div
              className="destino-gallery-modal-backdrop"
              onClick={onCloseGallery}
            >
              <div
                className="destino-gallery-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  aria-label="Cerrar galeria"
                  className="destino-gallery-modal-close"
                  onClick={onCloseGallery}
                  type="button"
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    close
                  </span>
                </button>

                <div className="destino-gallery-modal-head">
                  <div>
                    <strong>Galeria del destino</strong>
                    <span>{`${activeImageIndex + 1} / ${gallery.length}`}</span>
                  </div>
                </div>

                <div className="destino-gallery-slider">
                  <button
                    aria-label="Imagen anterior"
                    className="destino-gallery-slider-control"
                    onClick={handlePrevious}
                    type="button"
                  >
                    <span className="material-icons-outlined" aria-hidden="true">
                      chevron_left
                    </span>
                  </button>

                  <figure className="destino-gallery-slider-frame">
                    <img alt={activeImage.alt} src={activeImage.src} />
                    <figcaption>{activeImage.alt}</figcaption>
                  </figure>

                  <button
                    aria-label="Imagen siguiente"
                    className="destino-gallery-slider-control"
                    onClick={handleNext}
                    type="button"
                  >
                    <span className="material-icons-outlined" aria-hidden="true">
                      chevron_right
                    </span>
                  </button>
                </div>

                <div className="destino-gallery-thumbs">
                  {gallery.map((item, index) => (
                    <button
                      key={item.alt}
                      aria-label={`Ver imagen ${index + 1}`}
                      className={
                        index === activeImageIndex
                          ? "destino-gallery-thumb destino-gallery-thumb--active"
                          : "destino-gallery-thumb"
                      }
                      onClick={() => onSetActiveImageIndex(index)}
                      type="button"
                    >
                      <img alt={item.alt} src={item.src} />
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
