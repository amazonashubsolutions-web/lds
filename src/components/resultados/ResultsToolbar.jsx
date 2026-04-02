import { Link } from "react-router-dom";

import SearchPanel from "../buscador/SearchPanel";

function FiltersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 5h18"></path>
      <path d="M6 12h12"></path>
      <path d="M10 19h4"></path>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  );
}

export default function ResultsToolbar({
  filtersButtonRef,
  isFiltersOpen = false,
  onToggleFilters,
  onSortOptionChange,
  resultsHeadingRef,
  searchedDate = "",
  searchedDestination = "",
  selectedSortOption,
  summary,
}) {
  return (
    <section className="resultados-toolbar">
      <div className="resultados-toolbar-search-shell">
        <SearchPanel
          className="search-panel--resultados"
          initialDestination={searchedDestination}
          initialTravelDate={searchedDate}
        />
      </div>

      <div className="resultados-toolbar-header">
        <div className="resultados-toolbar-copy" ref={resultsHeadingRef}>
          <div className="resultados-toolbar-title-row">
            <h1>
              <span>{summary.titlePrefix ?? "Resultados para:"}</span>{" "}
              <span>{summary.destinationLabel ?? summary.title}</span>
            </h1>
          </div>
          <div className="resultados-toolbar-meta">
            <p>{summary.countLabel}</p>
            <Link
              className="resultados-destination-button"
              rel="noreferrer"
              target="_blank"
              to="/destino"
            >
              Conocer Destino
            </Link>
          </div>
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
            <span className="resultados-sort-label">Ordenar por</span>
            <div className="resultados-sort-value-row">
              <span className="resultados-sort-value">{selectedSortOption}</span>
              <span className="resultados-sort-pill-arrow" aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </div>
            <select
              aria-label="Ordenar por"
              onChange={(event) => onSortOptionChange?.(event.target.value)}
              value={selectedSortOption}
            >
              {summary.sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
