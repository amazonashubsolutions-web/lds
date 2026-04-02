import ResultCard from "./ResultCard";

export default function ResultsGrid({ items, searchedDate = "" }) {
  if (!items.length) {
    return (
      <section className="results-grid-empty">
        <h2>No encontramos resultados para esta combinacion</h2>
        <p>Prueba con otra categoria o cambia las subcategorias seleccionadas.</p>
      </section>
    );
  }

  return (
    <section className="results-grid">
      {items.map((item) => (
        <ResultCard key={item.id} item={item} searchedDate={searchedDate} />
      ))}
    </section>
  );
}
