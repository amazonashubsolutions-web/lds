import LoadingState from "../common/LoadingState";
import ResultCard from "./ResultCard";

export default function ResultsGrid({
  items,
  searchedDate = "",
  emptyTitle = "No encontramos resultados para esta combinacion",
  emptyDescription = "Prueba con otra categoria o cambia las subcategorias seleccionadas.",
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <section className="results-grid-empty">
        <LoadingState
          className="results-loading-state"
          title={emptyTitle}
          description={emptyDescription}
        />
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="results-grid-empty">
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
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
