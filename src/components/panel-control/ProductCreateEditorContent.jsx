import { PRICING_UNIT_OPTIONS } from "../../utils/productCreateDraft";
import {
  CreateSectionHead,
  RemoveItemAction,
} from "./ProductCreateSectionActions";

export default function ProductCreateEditorContent({
  availableSubcategories,
  draft,
  onAddObjectListItem,
  onAddStringListItem,
  onCategoryChange,
  onGeneralFieldChange,
  onRemoveObjectListItem,
  onRemoveStringListItem,
  onUpdateObjectListField,
  onUpdateStringListField,
  productCategories,
  requiresActivityTimes,
}) {
  return (
    <div className="detalle-producto-content">
      <section className="detalle-producto-hero-info">
        <div className="detalle-producto-hero-edit-head">
          <h1>{draft.title || "Nuevo producto"}</h1>
        </div>

        <div className="detalle-producto-location">
          {draft.city && draft.region
            ? `${draft.city}, ${draft.region}`
            : "Ubicacion por definir"}
        </div>

        <div className="detalle-producto-admin-edit-fields detalle-producto-create-meta-grid">
          <label className="detalle-producto-admin-edit-field">
            <span>Titulo</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) =>
                onGeneralFieldChange("title", event.target.value)
              }
              placeholder="Nombre del producto"
            />
          </label>

          <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--full">
            <span>Descripcion</span>
            <textarea
              rows={4}
              value={draft.summary}
              onChange={(event) =>
                onGeneralFieldChange("summary", event.target.value)
              }
              placeholder="Describe brevemente el producto."
            />
          </label>

          <label className="detalle-producto-admin-edit-field">
            <span>Categoria</span>
            <select
              value={draft.categoryId}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">Selecciona una categoria</option>
              {productCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="detalle-producto-admin-edit-field">
            <span>Subcategoria</span>
            <select
              value={draft.subcategoryId}
              onChange={(event) =>
                onGeneralFieldChange("subcategoryId", event.target.value)
              }
              disabled={!draft.categoryId}
            >
              <option value="">Selecciona una subcategoria</option>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.label}
                </option>
              ))}
            </select>
          </label>

          <label className="detalle-producto-admin-edit-field">
            <span>Ciudad</span>
            <input
              type="text"
              value={draft.city}
              onChange={(event) => onGeneralFieldChange("city", event.target.value)}
              placeholder="Ciudad principal"
            />
          </label>

          <label className="detalle-producto-admin-edit-field">
            <span>Region</span>
            <input
              type="text"
              value={draft.region}
              onChange={(event) => onGeneralFieldChange("region", event.target.value)}
              placeholder="Departamento o region"
            />
          </label>

          {requiresActivityTimes ? (
            <div
              className="detalle-producto-create-meta-grid"
              style={{ display: "grid", gap: "0.9rem" }}
            >
              <label className="detalle-producto-admin-edit-field">
                <span>Hora de salida</span>
                <input
                  type="time"
                  value={draft.departureTime}
                  onChange={(event) =>
                    onGeneralFieldChange("departureTime", event.target.value)
                  }
                />
              </label>

              <label className="detalle-producto-admin-edit-field">
                <span>Hora de regreso</span>
                <input
                  type="time"
                  value={draft.returnTime}
                  onChange={(event) =>
                    onGeneralFieldChange("returnTime", event.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          <div
            className="detalle-producto-create-meta-grid"
            style={{ display: "grid", gap: "0.9rem" }}
          >
            <label className="detalle-producto-admin-edit-field">
              <span>Punto de encuentro</span>
              <input
                type="text"
                value={draft.departurePoint}
                onChange={(event) =>
                  onGeneralFieldChange("departurePoint", event.target.value)
                }
                placeholder="Ej. Parque principal, lobby, recepcion"
              />
            </label>

            <label className="detalle-producto-admin-edit-field">
              <span>Unidad de precio</span>
              <select
                value={draft.pricingUnitLabel}
                onChange={(event) =>
                  onGeneralFieldChange("pricingUnitLabel", event.target.value)
                }
              >
                {PRICING_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="detalle-producto-section">
        <CreateSectionHead
          title="Descripcion general"
          addLabel="Agregar parrafo"
          onAddItem={() => onAddStringListItem("overview", "")}
        />

        <div className="detalle-producto-copy">
          {draft.overview.length ? (
            draft.overview.map((paragraph, index) => (
              <div
                className="detalle-producto-admin-edit-group"
                key={`overview-${index + 1}`}
              >
                <label className="detalle-producto-admin-edit-field">
                  <span>Descripcion {index + 1}</span>
                  <textarea
                    rows={5}
                    value={paragraph}
                    onChange={(event) =>
                      onUpdateStringListField("overview", index, event.target.value)
                    }
                  />
                </label>

                {draft.overview.length > 1 ? (
                  <RemoveItemAction
                    onClick={() => onRemoveStringListItem("overview", index)}
                  />
                ) : null}
              </div>
            ))
          ) : (
            <p className="detalle-producto-create-empty">
              Agrega el primer parrafo de descripcion general.
            </p>
          )}
        </div>
      </section>

      <section className="detalle-producto-section">
        <CreateSectionHead
          title="Itinerario"
          addLabel="Agregar parada"
          onAddItem={() =>
            onAddObjectListItem("itinerary", "itinerary", {
              day: `Paso ${draft.itinerary.length + 1}`,
              title: "",
              description: "",
            })
          }
        />

        <div className="detalle-producto-timeline">
          {draft.itinerary.length ? (
            draft.itinerary.map((item, index) => (
              <article className="detalle-producto-timeline-item" key={item.id}>
                <div className="detalle-producto-timeline-marker">{index + 1}</div>
                <div className="detalle-producto-timeline-body">
                  <div className="detalle-producto-admin-edit-group">
                    <label className="detalle-producto-admin-edit-field">
                      <span>Etiqueta</span>
                      <input
                        type="text"
                        value={item.day}
                        onChange={(event) =>
                          onUpdateObjectListField(
                            "itinerary",
                            index,
                            "day",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Titulo</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          onUpdateObjectListField(
                            "itinerary",
                            index,
                            "title",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="detalle-producto-admin-edit-field">
                      <span>Descripcion</span>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(event) =>
                          onUpdateObjectListField(
                            "itinerary",
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <RemoveItemAction
                      label="Eliminar parada"
                      onClick={() => onRemoveObjectListItem("itinerary", index)}
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="detalle-producto-create-empty">
              Agrega la primera parada del itinerario.
            </p>
          )}
        </div>
      </section>

      <section className="detalle-producto-section detalle-producto-section--surface">
        <CreateSectionHead
          title="Que incluye"
          addLabel="Agregar item"
          onAddItem={() =>
            onAddObjectListItem("includes", "include", {
              title: "",
              description: "",
            })
          }
        />

        <div className="detalle-producto-includes">
          {draft.includes.length ? (
            draft.includes.map((item, index) => (
              <article className="detalle-producto-include" key={item.id}>
                <div className="detalle-producto-include-check" aria-hidden="true">
                  <span className="material-icons-outlined">done</span>
                </div>
                <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                  <label className="detalle-producto-admin-edit-field">
                    <span>Titulo</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        onUpdateObjectListField(
                          "includes",
                          index,
                          "title",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="detalle-producto-admin-edit-field">
                    <span>Descripcion</span>
                    <textarea
                      rows={4}
                      value={item.description}
                      onChange={(event) =>
                        onUpdateObjectListField(
                          "includes",
                          index,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <RemoveItemAction
                    onClick={() => onRemoveObjectListItem("includes", index)}
                  />
                </div>
              </article>
            ))
          ) : (
            <p className="detalle-producto-create-empty">
              Agrega el primer elemento de que incluye.
            </p>
          )}
        </div>
      </section>

      <section className="detalle-producto-section detalle-producto-section--surface">
        <CreateSectionHead
          title="Que no incluye"
          addLabel="Agregar item"
          onAddItem={() =>
            onAddObjectListItem("excludes", "exclude", {
              title: "",
              description: "",
            })
          }
        />

        <div className="detalle-producto-includes">
          {draft.excludes.length ? (
            draft.excludes.map((item, index) => (
              <article className="detalle-producto-include" key={item.id}>
                <div
                  className="detalle-producto-include-check detalle-producto-include-check--exclude"
                  aria-hidden="true"
                >
                  <span className="material-icons-outlined">close</span>
                </div>
                <div className="detalle-producto-admin-edit-group detalle-producto-admin-edit-group--full">
                  <label className="detalle-producto-admin-edit-field">
                    <span>Titulo</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        onUpdateObjectListField(
                          "excludes",
                          index,
                          "title",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="detalle-producto-admin-edit-field">
                    <span>Descripcion</span>
                    <textarea
                      rows={4}
                      value={item.description}
                      onChange={(event) =>
                        onUpdateObjectListField(
                          "excludes",
                          index,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <RemoveItemAction
                    onClick={() => onRemoveObjectListItem("excludes", index)}
                  />
                </div>
              </article>
            ))
          ) : (
            <p className="detalle-producto-create-empty">
              Agrega el primer elemento de que no incluye.
            </p>
          )}
        </div>
      </section>

      <section className="detalle-producto-section">
        <CreateSectionHead
          title="Recomendaciones"
          addLabel="Agregar recomendacion"
          onAddItem={() => onAddStringListItem("recommendations", "")}
        />

        <div className="detalle-producto-notes-list">
          {draft.recommendations.map((item, index) => (
            <div
              className="detalle-producto-admin-edit-group"
              key={`recommendation-${index + 1}`}
            >
              <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                <span>Recomendacion {index + 1}</span>
                <textarea
                  rows={3}
                  value={item}
                  onChange={(event) =>
                    onUpdateStringListField(
                      "recommendations",
                      index,
                      event.target.value,
                    )
                  }
                />
              </label>

              {draft.recommendations.length > 1 ? (
                <RemoveItemAction
                  onClick={() => onRemoveStringListItem("recommendations", index)}
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="detalle-producto-section">
        <CreateSectionHead
          title="Consideraciones"
          addLabel="Agregar consideracion"
          onAddItem={() => onAddStringListItem("considerations", "")}
        />

        <div className="detalle-producto-notes-list">
          {draft.considerations.map((item, index) => (
            <div
              className="detalle-producto-admin-edit-group"
              key={`consideration-${index + 1}`}
            >
              <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                <span>Consideracion {index + 1}</span>
                <textarea
                  rows={3}
                  value={item}
                  onChange={(event) =>
                    onUpdateStringListField(
                      "considerations",
                      index,
                      event.target.value,
                    )
                  }
                />
              </label>

              {draft.considerations.length > 1 ? (
                <RemoveItemAction
                  onClick={() => onRemoveStringListItem("considerations", index)}
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="detalle-producto-section">
        <CreateSectionHead
          title="Politicas de cancelacion"
          addLabel="Agregar politica"
          onAddItem={() => onAddStringListItem("cancellationPolicies", "")}
        />

        <div className="detalle-producto-notes-list">
          {draft.cancellationPolicies.map((item, index) => (
            <div className="detalle-producto-admin-edit-group" key={`policy-${index + 1}`}>
              <label className="detalle-producto-admin-edit-field detalle-producto-admin-edit-field--compact">
                <span>Politica {index + 1}</span>
                <textarea
                  rows={3}
                  value={item}
                  onChange={(event) =>
                    onUpdateStringListField(
                      "cancellationPolicies",
                      index,
                      event.target.value,
                    )
                  }
                />
              </label>

              {draft.cancellationPolicies.length > 1 ? (
                <RemoveItemAction
                  onClick={() =>
                    onRemoveStringListItem("cancellationPolicies", index)
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
