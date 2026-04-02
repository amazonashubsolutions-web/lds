function cleanPhrase(phrase) {
  return phrase
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function collectKeywords(detail) {
  const metaPhrases = detail.meta
    .filter((item) => item.label === "Duracion" || item.label === "Punto de salida")
    .map((item) =>
      item.label === "Punto de salida" ? `Salida desde: ${item.value}` : item.value,
    );

  const phrases = [
    detail.title,
    ...metaPhrases,
    ...detail.includes.map((item) => item.title),
    ...detail.itinerary.map((item) => item.title),
  ];

  const uniquePhrases = [...new Set(phrases.map(cleanPhrase).filter((phrase) => phrase.length >= 3))];
  const accentClasses = [
    "detalle-producto-keyword--accent-a",
    "detalle-producto-keyword--accent-b",
    "detalle-producto-keyword--accent-c",
  ];

  return uniquePhrases.map((label, index) => ({
      label,
      sizeClass:
        index < 2
          ? "detalle-producto-keyword--xl"
          : index < 6
            ? "detalle-producto-keyword--lg"
            : index < 11
              ? "detalle-producto-keyword--md"
              : "detalle-producto-keyword--sm",
      toneClass:
        index === 0
          ? "detalle-producto-keyword--title"
          : accentClasses[(index - 1) % accentClasses.length],
    }));
}

export default function ProductKeywordCloud({ detail }) {
  const keywords = collectKeywords(detail);

  return (
    <section className="detalle-producto-section detalle-producto-section--surface">
      <div className="detalle-producto-section-head">
        <h2>Palabras clave</h2>
      </div>

      <p className="detalle-producto-keyword-intro">
        Frases clave construidas con lo que incluye el paseo y los momentos del itinerario.
      </p>

      <div className="detalle-producto-keyword-cloud">
        {keywords.map((keyword) => (
          <span
            key={keyword.label}
            className={`detalle-producto-keyword ${keyword.sizeClass} ${keyword.toneClass}`}
          >
            {keyword.label}
          </span>
        ))}
      </div>
    </section>
  );
}
