import { useState } from "react";

export default function DestinationJourneySection({
  faqs,
  faqSectionRef,
  itineraries,
  journeySectionRef,
}) {
  const [activeItineraryId, setActiveItineraryId] = useState(
    itineraries.options[0]?.id ?? ""
  );

  const activeItinerary =
    itineraries.options.find((option) => option.id === activeItineraryId) ??
    itineraries.options[0];

  return (
    <>
      <section
        className="destino-section destino-section--surface destino-anchor-target"
        ref={journeySectionRef}
      >
        <div className="destino-shell destino-journey-grid">
          <div className="destino-journey-options">
            <div className="destino-section-heading">
              <h2>Disena tu ruta</h2>
              <p>Ideas de viaje pensadas para tiempos distintos, con un hilo claro.</p>
            </div>

            <div className="destino-itinerary-options">
              {itineraries.options.map((option) => (
                <button
                  key={option.id}
                  className={
                    option.id === activeItinerary.id
                      ? "destino-itinerary-option destino-itinerary-option--active"
                      : "destino-itinerary-option"
                  }
                  type="button"
                  onClick={() => setActiveItineraryId(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="destino-itinerary-steps">
            {activeItinerary.steps.map((item) => (
              <article key={item.step} className="destino-itinerary-step">
                <div className="destino-itinerary-step-marker">{item.step}</div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="destino-section destino-anchor-target" ref={faqSectionRef}>
        <div className="destino-shell destino-faq-shell">
          <div className="destino-section-heading destino-section-heading--center">
            <h2>Preguntas frecuentes</h2>
            <p>Respuestas rapidas para resolver dudas antes de reservar.</p>
          </div>

          <div className="destino-faq-list">
            {faqs.map((item) => (
              <details key={item.question} className="destino-faq-item">
                <summary>
                  <span>{item.question}</span>
                  <span className="material-icons-outlined" aria-hidden="true">
                    expand_more
                  </span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
