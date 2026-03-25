export default function DashboardStatusCard({ status }) {
  return (
    <article className="panel-control-status-card">
      <div className="panel-control-status-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18"></path>
          <path d="M5 8l7-5 7 5"></path>
        </svg>
      </div>

      <div className="panel-control-status-copy">
        <h3>{status.title}</h3>
        <p>{status.text}</p>
      </div>

      <div className="panel-control-status-progress">
        <div className="panel-control-status-head">
          <span>{status.nextStatus}</span>
          <strong>{status.progress}%</strong>
        </div>
        <div className="panel-control-progress-track">
          <div className="panel-control-progress-fill" style={{ width: `${status.progress}%` }}></div>
        </div>
      </div>
    </article>
  );
}
