function ChipIcon({ icon }) {
  switch (icon) {
    case "bed":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18"></path>
          <path d="M5 12V8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v4"></path>
          <path d="M12 12V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3"></path>
          <path d="M4 12v6M20 12v6"></path>
        </svg>
      );
    case "flight":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 16l20-4-20-4 5 4-5 4Z"></path>
          <path d="M7 12h8"></path>
        </svg>
      );
    case "directions_car":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 16V9l2-3h10l2 3v7"></path>
          <path d="M3 16h18"></path>
          <circle cx="7.5" cy="16.5" r="1.5"></circle>
          <circle cx="16.5" cy="16.5" r="1.5"></circle>
        </svg>
      );
    case "explore":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m15.5 8.5-2.8 6.2-6.2 2.8 2.8-6.2 6.2-2.8Z"></path>
        </svg>
      );
    case "local_taxi":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 16V9l2-3h10l2 3v7"></path>
          <path d="M7 6l1-2h8l1 2"></path>
          <circle cx="7.5" cy="16.5" r="1.5"></circle>
          <circle cx="16.5" cy="16.5" r="1.5"></circle>
        </svg>
      );
    default:
      return null;
  }
}

export default function CategoryChips({ items }) {
  return (
    <section className="resultados-category-bar">
      <div className="resultados-category-list">
        {items.map((item) => (
          <button
            key={item.id}
            className={
              item.active
                ? "resultados-category-chip resultados-category-chip--active"
                : "resultados-category-chip"
            }
            type="button"
          >
            <span className="resultados-category-chip-icon" aria-hidden="true">
              <ChipIcon icon={item.icon} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
