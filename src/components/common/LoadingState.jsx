import LoadingSpinner from "./LoadingSpinner";

export default function LoadingState({
  title = "Cargando informacion",
  description = "Estamos consultando los datos mas recientes.",
  className = "",
  size = "lg",
}) {
  return (
    <div className={["lds-loading-state", className].filter(Boolean).join(" ")}>
      <LoadingSpinner label={title} size={size} />
      <div className="lds-loading-state-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
