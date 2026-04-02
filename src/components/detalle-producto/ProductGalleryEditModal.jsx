function getSlotTitle(slotIndex) {
  if (slotIndex === 0) {
    return "Imagen principal";
  }

  return `Imagen secundaria ${slotIndex}`;
}

export default function ProductGalleryEditModal({
  isOpen,
  productName,
  slots,
  selectedSlot,
  onSelectSlot,
  onSlotUrlChange,
  onRemoveSlot,
  onClose,
  onSave,
}) {
  if (!isOpen) {
    return null;
  }

  const activeSlot = slots[selectedSlot] ?? slots[0];
  const activeSlotTitle = getSlotTitle((activeSlot?.slot ?? 0) + 1);
  const activeSlotValue = activeSlot?.image?.url ?? "";
  const primarySlot = slots[0];
  const secondarySlots = slots.slice(1);

  function renderSlot(slot) {
    const isPrimary = slot.slot === 0;
    const isSelected = slot.slot === selectedSlot;
    const className = [
      "detalle-producto-gallery-editor-slot",
      isPrimary
        ? "detalle-producto-gallery-editor-slot--primary"
        : "detalle-producto-gallery-editor-slot--secondary",
      slot.image
        ? "detalle-producto-gallery-editor-slot--filled"
        : "detalle-producto-gallery-editor-slot--empty",
      isSelected
        ? "detalle-producto-gallery-editor-slot--selected"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        className={className}
        key={slot.slot}
        onClick={() => onSelectSlot(slot.slot)}
      >
        {slot.image ? (
          <img
            src={slot.image.url}
            alt={`${productName} ${getSlotTitle(slot.slot + 1).toLowerCase()}`}
          />
        ) : (
          <div className="detalle-producto-gallery-editor-slot-empty">
            <span className="material-icons-outlined" aria-hidden="true">
              add_photo_alternate
            </span>
            <strong>Agregar imagen</strong>
          </div>
        )}

        <span className="detalle-producto-gallery-editor-slot-label">
          {getSlotTitle(slot.slot + 1)}
        </span>
      </button>
    );
  }

  return (
    <div
      className="detalle-producto-gallery-editor-backdrop"
      onClick={onClose}
    >
      <div
        className="detalle-producto-gallery-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-producto-gallery-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="detalle-producto-gallery-editor-close"
          onClick={onClose}
          aria-label="Cerrar editor de galeria"
        >
          <span className="material-icons-outlined">close</span>
        </button>

        <div className="detalle-producto-gallery-editor-head">
          <p>Editar producto</p>
          <h3 id="detalle-producto-gallery-editor-title">{productName}</h3>
          <span>
            Organiza la galeria en 5 slots. Hoy trabaja con rutas o URLs y
            despues esta misma estructura se puede conectar a storage en
            Supabase sin rehacer la interfaz.
          </span>
        </div>

        <div className="detalle-producto-gallery-editor-layout">
          <div className="detalle-producto-gallery-editor-mosaic">
            {primarySlot ? renderSlot(primarySlot) : null}

            <div className="detalle-producto-gallery-editor-secondary-grid">
              {secondarySlots.map((slot) => renderSlot(slot))}
            </div>
          </div>

          <div className="detalle-producto-gallery-editor-panel">
            <div className="detalle-producto-gallery-editor-panel-copy">
              <p>{activeSlotTitle}</p>
              <span>
                Asigna una ruta local o una URL para este slot. Si lo dejas
                vacio, ese espacio queda disponible para completarlo despues.
              </span>
            </div>

            <label className="detalle-producto-gallery-editor-field">
              <span>Ruta o URL de la imagen</span>
              <input
                type="text"
                value={activeSlotValue}
                onChange={(event) =>
                  onSlotUrlChange(activeSlot.slot, event.target.value)
                }
                placeholder="Ej. /images/detalles_producto/nueva-imagen.jpg"
                autoComplete="off"
              />
            </label>

            <div className="detalle-producto-gallery-editor-actions">
              <button
                type="button"
                className="detalle-producto-gallery-editor-secondary"
                onClick={() => onRemoveSlot(activeSlot.slot)}
              >
                Limpiar slot
              </button>
              <button
                type="button"
                className="detalle-producto-gallery-editor-primary"
                onClick={onSave}
              >
                Guardar galeria
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
