import { useRef } from "react";

function getSlotTitle(slotIndex) {
  if (slotIndex === 0) {
    return "Imagen principal";
  }

  return `Imagen secundaria ${slotIndex}`;
}

export default function ProductGalleryEditor({
  productName,
  slots,
  selectedSlot,
  message,
  messageType,
  onSelectSlot,
  onChooseFile,
  onRemoveSlot,
  modeLabel = "Modo edicion",
  description = "Haz clic sobre cualquier slot para abrir el selector de archivos y reemplazar esa imagen.",
}) {
  const inputRefs = useRef([]);
  const primarySlot = slots[0];
  const secondarySlots = slots.slice(1);

  function openFilePicker(slotIndex) {
    const input = inputRefs.current[slotIndex];

    if (input) {
      input.click();
    }
  }

  function renderSlot(slot) {
    const isPrimary = slot.slot === 0;
    const isSelected = slot.slot === selectedSlot;
    const isFilled = Boolean(slot.image);
    const imageSource = slot.image?.previewUrl ?? slot.image?.url ?? "";
    const className = [
      "detalle-producto-gallery-editor-slot",
      isPrimary
        ? "detalle-producto-gallery-editor-slot--primary"
        : "detalle-producto-gallery-editor-slot--secondary",
      isFilled
        ? "detalle-producto-gallery-editor-slot--filled"
        : "detalle-producto-gallery-editor-slot--empty",
      isSelected
        ? "detalle-producto-gallery-editor-slot--selected"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={className} key={slot.slot}>
        <input
          ref={(element) => {
            inputRefs.current[slot.slot] = element;
          }}
          type="file"
          accept="image/*"
          className="detalle-producto-gallery-editor-input"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];

            if (selectedFile) {
              onChooseFile(slot.slot, selectedFile);
            }

            event.target.value = "";
          }}
        />

        <button
          type="button"
          className="detalle-producto-gallery-editor-slot-trigger"
          onClick={() => {
            onSelectSlot(slot.slot);
            openFilePicker(slot.slot);
          }}
        >
          {isFilled ? (
            <img
              src={imageSource}
              alt={`${productName} ${getSlotTitle(slot.slot).toLowerCase()}`}
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
            {getSlotTitle(slot.slot)}
          </span>

          <span className="detalle-producto-gallery-editor-slot-action">
            {isFilled ? "Cambiar imagen" : "Seleccionar imagen"}
          </span>
        </button>

        {isFilled ? (
          <button
            type="button"
            className="detalle-producto-gallery-editor-slot-clear"
            onClick={() => onRemoveSlot(slot.slot)}
          >
            Quitar
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section className="detalle-producto-gallery-editor-inline">
      <div className="detalle-producto-gallery-editor-inline-copy">
        <p>{modeLabel}</p>
        <span>{description}</span>
      </div>

      {message ? (
        <div
          className={`detalle-producto-gallery-editor-feedback${
            messageType ? ` detalle-producto-gallery-editor-feedback--${messageType}` : ""
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="detalle-producto-gallery-editor-mosaic">
        {primarySlot ? renderSlot(primarySlot) : null}

        <div className="detalle-producto-gallery-editor-secondary-grid">
          {secondarySlots.map((slot) => renderSlot(slot))}
        </div>
      </div>
    </section>
  );
}
