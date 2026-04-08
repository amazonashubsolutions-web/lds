function AddItemAction({ label, onClick }) {
  return (
    <button
      type="button"
      className="detalle-producto-inline-action detalle-producto-inline-action--add"
      onClick={onClick}
    >
      <span className="material-icons-outlined" aria-hidden="true">
        add
      </span>
      <span>{label}</span>
    </button>
  );
}

function RemoveItemAction({ label = "Eliminar", onClick }) {
  return (
    <button
      type="button"
      className="detalle-producto-inline-action detalle-producto-inline-action--remove"
      onClick={onClick}
    >
      <span className="material-icons-outlined" aria-hidden="true">
        delete
      </span>
      <span>{label}</span>
    </button>
  );
}

function CreateSectionHead({ title, addLabel, onAddItem }) {
  return (
    <div className="detalle-producto-section-head detalle-producto-section-head--editable">
      <h2>{title}</h2>
      {onAddItem ? <AddItemAction label={addLabel} onClick={onAddItem} /> : null}
    </div>
  );
}

export { AddItemAction, CreateSectionHead, RemoveItemAction };
