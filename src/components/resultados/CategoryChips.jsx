export default function CategoryChips({
  items,
  activeCategoryId,
  onSelectCategory,
}) {
  return (
    <section className="resultados-category-bar">
      <div className="resultados-category-list">
        {items.map((item) => {
          const isActive = item.id === activeCategoryId;

          return (
            <button
              key={item.id}
              aria-pressed={isActive}
              className={
                isActive
                  ? "resultados-category-chip resultados-category-chip--active"
                  : "resultados-category-chip"
              }
              onClick={() => onSelectCategory?.(item.id)}
              type="button"
            >
              {typeof item.count === "number" ? (
                <span className="resultados-category-chip-badge">{item.count}</span>
              ) : null}
              <span className="resultados-category-chip-icon" aria-hidden="true">
                <span className="material-icons-outlined" style={{ fontSize: "1.25rem" }}>
                  {item.icon}
                </span>
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
