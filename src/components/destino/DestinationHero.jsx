import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const DESTINATION_VIDEO_EMBED_URL =
  "https://www.youtube.com/embed/2Ds3pMbR4EE?autoplay=1&rel=0";

export default function DestinationHero({ hero, onOpenGallery, sectionRef }) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    if (!isVideoModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsVideoModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVideoModalOpen]);

  return (
    <>
      <section className="destino-hero destino-anchor-target" ref={sectionRef}>
        <div className="destino-shell destino-hero-layout">
          <div className="destino-hero-copy">
            <span className="destino-eyebrow">{hero.eyebrow}</span>
            <h1>{hero.title}</h1>
            <p className="destino-hero-subtitle">{hero.subtitle}</p>
            <p className="destino-hero-description">{hero.description}</p>

            <div className="destino-hero-actions">
              <button
                className="destino-primary-action"
                onClick={() => onOpenGallery(0)}
                type="button"
              >
                {hero.ctaLabel}
              </button>

              <button
                className="destino-video-card"
                onClick={() => setIsVideoModalOpen(true)}
                type="button"
              >
                <span className="material-icons-outlined" aria-hidden="true">
                  play_circle
                </span>
                <span>{hero.videoLabel}</span>
              </button>
            </div>
          </div>

          <div className="destino-hero-mosaic">
            {hero.mosaicImages.map((image) => (
              <article key={image.alt} className={image.className}>
                <img alt={image.alt} src={image.src} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {isVideoModalOpen
        ? createPortal(
            <div
              className="destino-video-modal-backdrop"
              onClick={() => setIsVideoModalOpen(false)}
            >
              <div
                className="destino-video-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  aria-label="Cerrar video"
                  className="destino-video-modal-close"
                  onClick={() => setIsVideoModalOpen(false)}
                  type="button"
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    close
                  </span>
                </button>

                <div className="destino-video-modal-frame">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={DESTINATION_VIDEO_EMBED_URL}
                    title={`Video del destino ${hero.title}`}
                  ></iframe>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
