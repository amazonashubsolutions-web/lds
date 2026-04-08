export default function ProductCreateFormErrorToast({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#d32f2f",
        color: "#fff",
        padding: "16px 24px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(211,47,47,0.4)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: "600",
        fontSize: "1rem",
        letterSpacing: "0.2px",
        animation:
          "slideUpFade 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
      role="alert"
    >
      <span className="material-icons-outlined" style={{ fontSize: "26px" }}>
        warning_amber
      </span>
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          marginLeft: "12px",
          display: "flex",
          borderRadius: "50%",
          padding: "4px",
          transition: "background 0.2s",
        }}
        onMouseOver={(event) => {
          event.currentTarget.style.background = "rgba(255,255,255,0.3)";
        }}
        onMouseOut={(event) => {
          event.currentTarget.style.background = "rgba(255,255,255,0.2)";
        }}
      >
        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>
          close
        </span>
      </button>
      <style>{`
        @keyframes slideUpFade {
          from { transform: translate(-50%, 30px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
