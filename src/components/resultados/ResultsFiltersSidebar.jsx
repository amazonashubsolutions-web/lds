function FilterSection({ title, children, className = "" }) {
  return (
    <section className={`resultados-filter-section ${className}`.trim()}>
      <div className="resultados-filter-heading">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

export default function ResultsFiltersSidebar({
  filters,
  className = "",
  subcategoryOptions = [],
  selectedSubcategoryIds = [],
  onToggleSubcategory,
  onFilterOptionSelect,
  onPriceLimitChange,
  priceRangeLabels,
  priceRangeMax,
  priceRangeMin,
  selectedPriceLimit,
  subcategoryContextLabel = "",
  keywordQuery = "",
  onKeywordQueryChange,
  keywordSearchTitle = "Busca un producto turistico",
}) {
  return (
    <aside className={`resultados-sidebar ${className}`.trim()}>
      <section className="resultados-sidebar-search">
        <h2>{keywordSearchTitle}</h2>

        <label className="resultados-sidebar-search-field">
          <span className="resultados-sidebar-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            onChange={(event) => onKeywordQueryChange?.(event.target.value)}
            placeholder="Busca por nombre o lugar"
            type="search"
            value={keywordQuery}
          />
        </label>
      </section>

      <div className="resultados-sidebar-head">
        <h2>Filtros</h2>
        <p>Refina tu busqueda</p>
      </div>

      <FilterSection title="Rango de precio">
        <input
          className="resultados-range"
          max={priceRangeMax}
          min={priceRangeMin}
          onChange={(event) => onPriceLimitChange?.(Number(event.target.value))}
          step={filters.priceRange.step}
          type="range"
          value={selectedPriceLimit}
        />
        <div className="resultados-range-values">
          <span>{priceRangeLabels?.min}</span>
          <span>{priceRangeLabels?.max}</span>
        </div>
      </FilterSection>

      {subcategoryOptions.length ? (
        <FilterSection title="Subcategorias">
          <p className="resultados-filter-note">{subcategoryContextLabel}</p>
          <div className="resultados-filter-options">
            {subcategoryOptions.map((item) => (
              <label key={item.id} className="resultados-check-option">
                <input
                  checked={selectedSubcategoryIds.includes(item.id)}
                  onChange={() => {
                    onToggleSubcategory?.(item.id);
                    onFilterOptionSelect?.();
                  }}
                  type="checkbox"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}
    </aside>
  );
}
