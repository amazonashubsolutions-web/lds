function ActivityIcon({ type }) {
  if (type === "danger") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M15 9l-6 6"></path>
        <path d="M9 9l6 6"></path>
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l8 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9l8-6z"></path>
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

export default function DashboardActivityFeed({ items }) {
  return (
    <section className="panel-control-card">
      <div className="panel-control-card-head">
        <h3>Actividad</h3>
        <button type="button">•••</button>
      </div>

      <div className="panel-control-activity-list">
        {items.map((item) => (
          <article className="panel-control-activity-item" key={item.id}>
            <div
              className={`panel-control-activity-icon panel-control-activity-icon--${item.type}`}
              aria-hidden="true"
            >
              <ActivityIcon type={item.type} />
            </div>
            <div className="panel-control-activity-copy">
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
