function FiltersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 5h18"></path>
      <path d="M6 12h12"></path>
      <path d="M10 19h4"></path>
    </svg>
  );
}

export default function ResultsToolbar({
  filtersButtonRef,
  summary,
  onToggleFilters,
  isFiltersOpen = false,
}) {
  return (
    <section className="resultados-toolbar">
      <div className="resultados-toolbar-copy">
        <h1>{summary.title}</h1>
        <p>{summary.countLabel}</p>
      </div>

      <div className="resultados-toolbar-actions">
        <button
          className={
            isFiltersOpen
              ? "resultados-filters-pill resultados-filters-pill--active"
              : "resultados-filters-pill"
          }
          onClick={onToggleFilters}
          ref={filtersButtonRef}
          type="button"
        >
          <span className="resultados-filters-pill-icon" aria-hidden="true">
            <FiltersIcon />
          </span>
          <span>Filtros</span>
        </button>

        <div className="resultados-sort-pill">
          <span>Ordenar Por:</span>
          <select defaultValue={summary.sortOptions[0]}>
            {summary.sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
