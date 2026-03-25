function FilterSection({ title, children }) {
  return (
    <section className="resultados-filter-section">
      <div className="resultados-filter-heading">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function ResultsFiltersSidebar({ filters, className = "" }) {
  return (
    <aside className={`resultados-sidebar ${className}`.trim()}>
      <div className="resultados-sidebar-head">
        <h2>Filtros</h2>
        <p>Refina tu busqueda</p>
      </div>

      <FilterSection title="Rango de precio">
        <input
          className="resultados-range"
          defaultValue={filters.priceRange.value}
          type="range"
        />
        <div className="resultados-range-values">
          <span>{filters.priceRange.minLabel}</span>
          <span>{filters.priceRange.maxLabel}</span>
        </div>
      </FilterSection>

      <FilterSection title="Calificaciones">
        <div className="resultados-filter-options">
          {filters.guestRatings.map((item) => (
            <label key={item} className="resultados-check-option">
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Comodidades">
        <div className="resultados-filter-options">
          {filters.amenities.map((item) => (
            <label key={item} className="resultados-check-option">
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Duracion del viaje">
        <div className="resultados-filter-options">
          {filters.tripDuration.map((item) => (
            <label key={item} className="resultados-check-option">
              <input name="tripDuration" type="radio" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <button className="resultados-apply-button" type="button">
        Aplicar filtros
      </button>
    </aside>
  );
}
