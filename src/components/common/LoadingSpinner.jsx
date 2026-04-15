export default function LoadingSpinner({
  className = "",
  label = "Cargando",
  size = "md",
}) {
  const normalizedSize =
    size === "sm" || size === "lg" ? size : "md";

  return (
    <span
      className={["lds-spinner", `lds-spinner--${normalizedSize}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      role="status"
    >
      <span className="lds-spinner-ring" aria-hidden="true" />
      <span className="lds-spinner-label sr-only">{label}</span>
    </span>
  );
}
