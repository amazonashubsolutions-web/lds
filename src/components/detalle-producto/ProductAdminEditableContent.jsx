function EditableAction({ isActive, onClick }) {
  return (
    <button
      type="button"
      className={`detalle-producto-edit-action${
        isActive ? " detalle-producto-edit-action--active" : ""
      }`}
      onClick={onClick}
    >
      <span className="material-icons-outlined" aria-hidden="true">
        edit
      </span>
      <span>{isActive ? "Editando" : "Editar"}</span>
    </button>
  );
}

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

function EditableSectionHead({
  title,
  blockId,
  activeBlock,
  onActivateBlock,
  addLabel,
  onAddItem,
}) {
  const isActive = activeBlock === blockId;

  return (
    <div className="detalle-producto-section-head detalle-producto-section-head--editable">
      <h2>{title}</h2>

      <div className="detalle-producto-section-head-actions">
        {isActive && onAddItem ? (
          <AddItemAction label={addLabel} onClick={onAddItem} />
        ) : null}

        <EditableAction
          isActive={isActive}
          onClick={() => onActivateBlock(blockId)}
        />
      </div>
    </div>
  );
}

function ProductMeta({ items }) {
  return (
    <div className="detalle-producto-meta">
      {items.map((item) => (
        <div className="detalle-producto-meta-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function ProductAdminEditableContent({
  detail,
  draft,
  activeBlock,
  onActivateBlock,
  onTitleChange,
  onSummaryChange,
  onOverviewChange,
  onItineraryChange,
  onIncludesChange,
  onExcludesChange,
  onRecommendationsChange,
  onConsiderationsChange,
  onCancellationPolicyChange,
  onAddItineraryItem,
  onRemoveItineraryItem,
  onAddIncludeItem,
  onRemoveIncludeItem,
  onAddExcludeItem,
  onRemoveExcludeItem,
  onAddRecommendationItem,
  onRemoveRecommendationItem,
  onAddConsiderationItem,
  onRemoveConsiderationItem,
  onAddCancellationPolicyItem,
  onRemoveCancellationPolicyItem,
}) {
  return (
    <>
      <section className="detalle-producto-hero-info">
        <div className="detalle-producto-hero-edit-head">
          <h1>{draft.title}</h1>
          <EditableAction
            isActive={activeBlock === "hero"}
            onClick={() => onActivateBlock("hero")}
          />
        </div>

        <div className="detalle-producto-location">{detail.location}</div>

        {activeBlock === "hero" ? (
          <div className="detalle-producto-admin-edit-fields">
            <label className="detalle-producto-admin-edit-field">
              <span>Titulo del producto</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => onTitleChange(event.target.value)}
              />
            </label>

            <label className="detalle-producto-admin-edit-field">
              <span>Resumen del producto</span>
              <textarea
                rows={4}
                value={draft.summary}
                onChange={(event) => onSummaryChange(event.target.value)}
              />
            </label>
          </div>
        ) : (
          <p className="detalle-producto-summary">{draft.summary}</p>
        )}

        <ProductMeta items={detail.meta} />
      </section>

      <section className="detalle-producto-section">
        <EditableSectionHead
          title="Descripcion general"
          blockId="overview"
          activeBlock={activeBlock}
          onActivateBlock={onActivateBlock}
        />

        <div className="detalle-producto-copy">
          {draft.overview.map((paragraph, index) =>
            activeBlock === "overview" ? (
              <label
                className="detalle-producto-admin-edit-field"
                key={`overview-${index + 1}`}
              >
                <span>Parrafo {index + 1}</span>
                <textarea
                  rows={5}
                  value={paragraph}
                  onChange={(event) =>
                    onOverviewChange(index, event.target.value)
                  }
                />
              </label>
            ) : (
              <p key={`${paragraph}-${index + 1}`}>{paragraph}</p>
            ),
          )}
        </div>
      </section>

      <section className="detalle-producto-section">
        <EditableSectionHead
          title="Itinerario"
          blockId="itinerary"
          activeBlock={activeBlock}
          onActivateBlock={onActivateBlock}
          addLabel="Agregar parada"
          onAddItem={onAddItineraryItem}
        />

        <div className="detalle-producto-timeline">
          {draft.itinerary.map((item, index) => (
            <article className="detalle-producto-timeline-item" key={item.id}>
              <div className="detalle-producto-timeline-marker">{index + 1}</div>
              <div className="detalle-producto-timeline-body">
                {activeBlock === "itinerary" ? (
                  <div className="detalle-producto-admin-edit-group">
                    <label className="detalle-producto-admin-edit-field">
                      <span>Etiqueta</span>
                      <input
                        type="text"
                        value={item.day}
                        onChange={(event) =>
                          onItineraryChange(index, "day", event.target.value)
                        }
                      />
                    </label>
                    <label className="detalle-producto-admin-edit-field">
                      <span>Titulo</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          onItineraryChange(index, "title", event.target.value)
                        }
                      />
                    </label>
                    <label className="detalle-producto-admin-edit-field">
                      <span>Descripcion</span>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(event) =>
                          onItineraryChange(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <RemoveItemAction
                      label="Eliminar parada"
                      onClick={() => onRemoveItineraryItem(index)}
                    />
                  </div>
                ) : (
                  <>
                    <span>{item.day}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="detalle-producto-section detalle-producto-section--surface">
        <EditableSectionHead
          title="Que incluye"
          blockId="includes"
          activeBlock={activeBlock}
          onActivateBlock={onActivateBlock}
          addLabel="Agregar item"
          onAddItem={onAddIncludeItem}
        />

        <div className="detalle-producto-includes">
          {draft.includes.map((item, index) => (
            <article className="detalle-producto-include" key={item.id}>
              <div className="detalle-producto-include-check" aria-hidden="true">
                <span className="material-icons-outlined">done</span>
              </div>
              <div>
                {activeBlock === "includes" ? (
                  <div className="detalle-producto-admin-edit-group">
                    <label className="detalle-producto-admin-edit-field">
                      <span>Titulo</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          onIncludesChange(index, "title", event.target.value)
                        }
                      />
                    </label>
                    <label className="detalle-producto-admin-edit-field">
                      <span>Descripcion</span>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(event) =>
                          onIncludesChange(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <RemoveItemAction onClick={() => onRemoveIncludeItem(index)} />
                  </div>
                ) : (
                  <>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="detalle-producto-section detalle-producto-section--surface">
        <EditableSectionHead
          title="Que no incluye"
          blockId="excludes"
          activeBlock={activeBlock}
          onActivateBlock={onActivateBlock}
          addLabel="Agregar item"
          onAddItem={onAddExcludeItem}
        />

        <div className="detalle-producto-includes">
          {draft.excludes.map((item, index) => (
            <article className="detalle-producto-include" key={item.id}>
              <div
                className="detalle-producto-include-check detalle-producto-include-check--exclude"
                aria-hidden="true"
              >
                <span className="material-icons-outlined">close</span>
              </div>
              <div>
                {activeBlock === "excludes" ? (
                  <div className="detalle-producto-admin-edit-group">
                    <label className="detalle-producto-admin-edit-field">
                      <span>Titulo</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          onExcludesChange(index, "title", event.target.value)
                        }
                      />
                    </label>
                    <label className="detalle-producto-admin-edit-field">
                      <span>Descripcion</span>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(event) =>
                          onExcludesChange(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <RemoveItemAction onClick={() => onRemoveExcludeItem(index)} />
                  </div>
                ) : (
                  <>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="detalle-producto-section detalle-producto-section--surface">
        <EditableSectionHead
          title="Recomendaciones para tu paseo"
          blockId="recommendations"
          activeBlock={activeBlock}
          onActivateBlock={onActivateBlock}
          addLabel="Agregar recomendacion"
          onAddItem={onAddRecommendationItem}
        />

        <div className="detalle-producto-recommendations">
          {draft.recommendations.map((item, index) => (
            <article className="detalle-producto-recommendation" key={`${item}-${index + 1}`}>
              <div className="detalle-producto-recommendation-icon" aria-hidden="true">
                <span className="material-icons-outlined">check_circle</span>
              </div>

              {activeBlock === "recommendations" ? (
                <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                  <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                    <span>Recomendacion {index + 1}</span>
                    <textarea
                      rows={3}
                      value={item}
                      onChange={(event) =>
                        onRecommendationsChange(index, event.target.value)
                      }
                    />
                  </label>

                  <RemoveItemAction
                    onClick={() => onRemoveRecommendationItem(index)}
                  />
                </div>
              ) : (
                <p>{item}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="detalle-producto-section detalle-producto-section--surface">
        <div className="detalle-producto-notes-block">
          <EditableSectionHead
            title="Para tener en cuenta"
            blockId="considerations"
            activeBlock={activeBlock}
            onActivateBlock={onActivateBlock}
            addLabel="Agregar item"
            onAddItem={onAddConsiderationItem}
          />

          <ul className="detalle-producto-notes-list">
            {draft.considerations.map((item, index) => (
              <li key={`${item}-${index + 1}`}>
                {activeBlock === "considerations" ? (
                  <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                    <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                      <span>Consideracion {index + 1}</span>
                      <textarea
                        rows={3}
                        value={item}
                        onChange={(event) =>
                          onConsiderationsChange(index, event.target.value)
                        }
                      />
                    </label>

                    <RemoveItemAction
                      onClick={() => onRemoveConsiderationItem(index)}
                    />
                  </div>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="detalle-producto-notes-block">
          <EditableSectionHead
            title="Politicas de cancelacion"
            blockId="cancellationPolicies"
            activeBlock={activeBlock}
            onActivateBlock={onActivateBlock}
            addLabel="Agregar politica"
            onAddItem={onAddCancellationPolicyItem}
          />

          <ul className="detalle-producto-notes-list">
            {draft.cancellationPolicies.map((item, index) => (
              <li key={`${item}-${index + 1}`}>
                {activeBlock === "cancellationPolicies" ? (
                  <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                    <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                      <span>Politica {index + 1}</span>
                      <textarea
                        rows={3}
                        value={item}
                        onChange={(event) =>
                          onCancellationPolicyChange(index, event.target.value)
                        }
                      />
                    </label>

                    <RemoveItemAction
                      onClick={() => onRemoveCancellationPolicyItem(index)}
                    />
                  </div>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
