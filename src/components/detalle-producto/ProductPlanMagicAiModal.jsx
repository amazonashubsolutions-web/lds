import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { productSubcategories } from "../../data/productsData";
import { getProductCategoryTheme } from "../../utils/productCategoryThemes";

export default function ProductPlanMagicAiModal({
  isOpen,
  onClose,
  onGenerate,
  onStartManual,
  initialData,
  onBackToSetup,
}) {
  const selectedCategory = "planes";
  const theme = getProductCategoryTheme("planes");
  const today = new Date().toISOString().split("T")[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const maxDate = oneYearLater.toISOString().split("T")[0];

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiData, setAiData] = useState(null);

  const [nombrePlan, setNombrePlan] = useState("");
  const [cityName, setCityName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [numeroDias, setNumeroDias] = useState(1);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [itineraryTitles, setItineraryTitles] = useState([""]);

  const [editableGeneratedTitle, setEditableGeneratedTitle] = useState("");
  const [editableShortDescription, setEditableShortDescription] = useState("");
  const [editableOverview, setEditableOverview] = useState("");

  const [pricesLow, setPricesLow] = useState({ adult: "", child: "", baby: "" });
  const [pricesHigh, setPricesHigh] = useState({ adult: "", child: "", baby: "" });
  const [pricesLowGroup, setPricesLowGroup] = useState({ adult: "", child: "", baby: "" });
  const [pricesHighGroup, setPricesHighGroup] = useState({ adult: "", child: "", baby: "" });

  const [seasons, setSeasons] = useState([]);
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonStart, setNewSeasonStart] = useState("");
  const [newSeasonEnd, setNewSeasonEnd] = useState("");

  const [images, setImages] = useState([]);

  const availableSubcategories = useMemo(
    () => productSubcategories.filter((subcategory) => subcategory.categoryId === selectedCategory),
    [],
  );

  const hasCompleteSeasonDraft = Boolean(newSeasonTitle && newSeasonStart && newSeasonEnd);
  const remainingImageSlots = Math.max(0, 5 - images.length);
  const canAddMoreImages = images.length < 5;

  const parseDaysFromSubcategory = (subcategoryId) => {
    const match = String(subcategoryId || "").match(/\d+/);
    return match ? Number(match[0]) : 1;
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextTourName = initialData?.tourName || "";
    const nextCityName = initialData?.cityName || "";
    const nextRegionName = initialData?.regionName || "";
    const nextSelectedSubcategory = initialData?.selectedSubcategory || "";
    const nextNumeroDias = initialData?.numeroDias || parseDaysFromSubcategory(nextSelectedSubcategory);

    setToast(null);
    setIsGenerating(false);
    setAiData(null);
    setEditableGeneratedTitle("");
    setEditableShortDescription("");
    setEditableOverview("");
    setPricesLow({ adult: "", child: "", baby: "" });
    setPricesHigh({ adult: "", child: "", baby: "" });
    setPricesLowGroup({ adult: "", child: "", baby: "" });
    setPricesHighGroup({ adult: "", child: "", baby: "" });
    setSeasons([]);
    setNewSeasonTitle("");
    setNewSeasonStart("");
    setNewSeasonEnd("");
    setImages([]);

    setNombrePlan(nextTourName);
    setCityName(nextCityName);
    setRegionName(nextRegionName);
    setSelectedSubcategory(nextSelectedSubcategory);
    setNumeroDias(nextNumeroDias || 1);
    setItineraryTitles(Array.from({ length: nextNumeroDias || 1 }, () => ""));

    const hasAutoSetup =
      Boolean(nextTourName) &&
      Boolean(nextCityName) &&
      Boolean(nextRegionName) &&
      Boolean(nextSelectedSubcategory);

    setStep(hasAutoSetup ? 2 : 1);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!selectedSubcategory) {
      return;
    }

    const nextNumeroDias = parseDaysFromSubcategory(selectedSubcategory);
    setNumeroDias(nextNumeroDias);
  }, [selectedSubcategory]);

  useEffect(() => {
    setItineraryTitles((currentTitles) => Array.from({ length: numeroDias || 1 }, (_, idx) => currentTitles[idx] || ""));
  }, [numeroDias]);

  useEffect(() => {
    if (!aiData) {
      return;
    }

    setEditableGeneratedTitle(aiData.titulo || "");
    setEditableShortDescription(aiData.descripcion_breve || "");
    setEditableOverview(
      Array.isArray(aiData.descripcion_general) ? aiData.descripcion_general.join("\n\n") : "",
    );
  }, [aiData]);

  if (!isOpen) {
    return null;
  }

  const showToast = (message) => {
    setToast({ message });
  };

  const handleFetchAi = async () => {
    if (!nombrePlan || !cityName || !regionName || !selectedSubcategory) {
      showToast("Completa nombre, ciudad, region y subcategoria antes de generar.");
      return;
    }

    if (itineraryTitles.some((title) => !title.trim())) {
      showToast("Completa todos los titulos del itinerario antes de generar.");
      return;
    }

    const startedAt = Date.now();
    setAiData(null);
    setIsGenerating(true);
    setStep(3);

    try {
      const response = await fetch("/src/data/mockAiResponsePlanes.json");
      if (!response.ok) {
        throw new Error(`Mock IA no disponible: ${response.status}`);
      }

      const data = await response.json();
      const elapsed = Date.now() - startedAt;
      const minimumDelay = 2400;

      if (elapsed < minimumDelay) {
        await new Promise((resolve) => window.setTimeout(resolve, minimumDelay - elapsed));
      }

      setAiData(data);
    } catch (error) {
      console.error("Error fetching Plan AI data", error);
      setStep(2);
      showToast("No pudimos generar la propuesta IA del plan. Intenta nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSeason = () => {
    if (!hasCompleteSeasonDraft) {
      showToast("Completa titulo y fechas antes de agregar la temporada.");
      return;
    }

    setSeasons((current) => [
      ...current,
      { title: newSeasonTitle, start: newSeasonStart, end: newSeasonEnd },
    ]);
    setNewSeasonTitle("");
    setNewSeasonStart("");
    setNewSeasonEnd("");
  };

  const handleRemoveSeason = (indexToRemove) => {
    setSeasons((current) => current.filter((_, idx) => idx !== indexToRemove));
  };

  const handleContinueFromSeasons = () => {
    const hasPendingSeasonDraft = Boolean(newSeasonTitle || newSeasonStart || newSeasonEnd);

    if (hasCompleteSeasonDraft) {
      showToast("La temporada ya esta lista. Presiona el boton verde '+ Agregar' antes de continuar.");
      return;
    }

    if (hasPendingSeasonDraft) {
      showToast("Completa la temporada o limpia los campos antes de continuar.");
      return;
    }

    if (seasons.length === 0) {
      showToast("Debes agregar al menos una temporada especial antes de continuar.");
      return;
    }

    setStep(6);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    const limit = 5 - images.length;
    const allowedFiles = files.slice(0, limit);

    if (files.length > limit) {
      showToast("Solo puedes cargar hasta 5 imagenes en total.");
    }

    const nextImages = allowedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((current) => [...current, ...nextImages]);
    event.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((current) => current.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFinishWizard = () => {
    const finalAiData = aiData
      ? {
          ...aiData,
          titulo: editableGeneratedTitle,
          descripcion_breve: editableShortDescription,
          descripcion_general: editableOverview
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean),
        }
      : aiData;

    const wizardData = {
      tourName: nombrePlan,
      cityName,
      regionName,
      numeroDias,
      itineraryTitles,
      selectedSubcategory,
      aiData: finalAiData,
      pricesLow,
      pricesHigh,
      pricesLowGroup,
      pricesHighGroup,
      seasons,
      images,
    };

    onGenerate(selectedCategory, wizardData);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Configuracion del Plan";
      case 2:
        return "Titulos del Itinerario";
      case 3:
        return !isGenerating && !aiData ? "Generacion con IA" : "Propuesta IA";
      case 4:
        return "Configuracion de Tarifas";
      case 5:
        return "Temporadas Especiales";
      case 6:
        return "Galeria de Imagenes";
      case 7:
        return "Confirmacion Final";
      default:
        return "";
    }
  };

  const renderStepIndicator = () => (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        {[1, 2, 3, 4, 5, 6, 7].map((wizardStep) => (
          <div
            key={wizardStep}
            style={{
              height: "6px",
              width: "35px",
              borderRadius: "3px",
        backgroundColor: wizardStep <= step ? theme.primary : "#eee",
              transition: "background-color 0.3s ease",
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: "800",
    color: theme.primary,
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "0.25rem",
          }}
        >
          Paso {step} de 7
        </p>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "900", color: "#0f172a" }}>
          {getStepTitle()}
        </h2>
      </div>
    </div>
  );

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block",
    marginBottom: "0.25rem",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "#444",
  };
  const buttonStylePrimary = {
    width: "100%",
    minWidth: 0,
    padding: "0.85rem",
    borderRadius: "8px",
    border: "none",
    background: theme.primary,
    color: "#fff",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  };
  const buttonStyleSecondary = {
    width: "auto",
    minWidth: "132px",
    padding: "0.85rem 1.15rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#666",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return createPortal(
    <div
      className="product-magic-ai-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="presentation"
    >
      <div
        className="product-magic-ai-modal"
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "560px",
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          fontFamily: "inherit",
          textAlign: "center",
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {toast ? (
          <div
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              right: "3.5rem",
              padding: "0.8rem 1rem",
              borderRadius: "10px",
              background: "#ecfeff",
              border: "1px solid #67e8f9",
              color: "#155e75",
              fontSize: "0.9rem",
              fontWeight: "700",
              textAlign: "left",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
              zIndex: 2,
            }}
            role="alert"
          >
            {toast.message}
          </div>
        ) : null}

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#666",
            padding: "0.2rem",
          }}
          aria-label="Cerrar wizard"
        >
          <span className="material-icons-outlined" style={{ fontSize: "1.5rem" }}>
            close
          </span>
        </button>

        {renderStepIndicator()}

        {step === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span
                className="material-icons-outlined"
        style={{ fontSize: "36px", color: theme.primary, marginBottom: "0.5rem" }}
              >
                travel_explore
              </span>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                Define la base del plan para que la IA te proponga un borrador turistico listo para revisar.
              </p>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Nombre del Plan</label>
              <input
                type="text"
                value={nombrePlan}
                onChange={(event) => setNombrePlan(event.target.value)}
                placeholder="Ej. Amazonas Inmersivo"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(event) => setCityName(event.target.value)}
                  placeholder="Ej. Leticia"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Region</label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(event) => setRegionName(event.target.value)}
                  placeholder="Ej. Amazonas"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Subcategoria</label>
              {selectedSubcategory ? (
                <div style={{ ...inputStyle, background: "#f8fafc", color: "#0f172a", fontWeight: "700" }}>
                  {availableSubcategories.find((item) => item.id === selectedSubcategory)?.label || selectedSubcategory}
                </div>
              ) : (
                <select
                  value={selectedSubcategory}
                  onChange={(event) => setSelectedSubcategory(event.target.value)}
                  style={inputStyle}
                >
                  <option value="" disabled>
                    Selecciona una subcategoria...
                  </option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ padding: "0.9rem 1rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem", lineHeight: "1.5" }}>
                Este plan usara una estructura estimada de <strong style={{ color: "#0f172a" }}>{numeroDias} dia{numeroDias === 1 ? "" : "s"}</strong> segun la subcategoria elegida.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => {
                  if (onBackToSetup) {
                    onBackToSetup({
                      selectedCategory,
                      selectedSubcategory,
                      tourName: nombrePlan,
                      cityName,
                      regionName,
                      numeroDias,
                    });
                    return;
                  }
                  onClose();
                }}
                style={buttonStyleSecondary}
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (!nombrePlan || !cityName || !regionName || !selectedSubcategory) {
                    showToast("Completa nombre, ciudad, region y subcategoria para continuar.");
                    return;
                  }
                  setStep(2);
                }}
                style={{ ...buttonStylePrimary, flex: 2 }}
              >
                Continuar al Itinerario
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: "1.55" }}>
              Define los titulos principales para cada dia. Esto ayudara a la IA a construir una propuesta mas cercana a la experiencia que quieres vender.
            </p>

            <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1.5rem" }}>
              {itineraryTitles.map((title, idx) => (
                <div
                  key={`itinerary-title-${idx}`}
                  style={{
                    padding: "0.9rem",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label style={{ ...labelStyle, marginBottom: "0.35rem" }}>
                    Dia {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => {
                      const nextTitles = [...itineraryTitles];
                      nextTitles[idx] = event.target.value;
                      setItineraryTitles(nextTitles);
                    }}
                    placeholder={`Ej. ${idx === 0 ? "Bienvenida y primer contacto con el destino" : "Experiencia destacada del dia"}`}
                    style={{ ...inputStyle, background: "#ffffff", border: "1px solid #cbd5e1", boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(1)} style={buttonStyleSecondary}>
                Volver
              </button>
              <button
                onClick={() => {
                  if (itineraryTitles.some((title) => !title.trim())) {
                    showToast("Completa todos los titulos del itinerario antes de continuar.");
                    return;
                  }
                  setStep(3);
                }}
                style={{ ...buttonStylePrimary, flex: 2 }}
              >
                Generar con IA
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            {!isGenerating && !aiData ? (
              <div style={{ animation: "fadeIn 0.3s ease", padding: "1rem 0" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span
                    className="material-icons-outlined"
            style={{ fontSize: "4rem", color: theme.primary, animation: "pulse 2s infinite" }}
                  >
                    auto_awesome
                  </span>
                  <h3 style={{ margin: "1rem 0 0.5rem", color: "#111827", fontSize: "1.05rem", fontWeight: "900" }}>
                    Listo para Generar
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
                    Nuestro experto IA construira una propuesta completa basada en tu itinerario, destino y nivel de plan.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <button onClick={() => setStep(2)} style={buttonStyleSecondary}>
                    Ajustar Itinerario
                  </button>
                  <button onClick={handleFetchAi} style={{ ...buttonStylePrimary, flex: 2 }}>
                    Generar con IA ahora
                  </button>
                </div>

                <button
                  onClick={() =>
                    onStartManual(selectedCategory, {
                      tourName: nombrePlan,
                      cityName,
                      regionName,
                      selectedSubcategory,
                      numeroDias,
                    })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    textDecoration: "underline",
                    fontSize: "0.82rem",
                    marginTop: "1.35rem",
                    cursor: "pointer",
                  }}
                >
                  Prefiero llenar todo manualmente
                </button>
              </div>
            ) : isGenerating ? (
              <div style={{ padding: "1rem 0.2rem 0.25rem", textAlign: "center" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span
                    className="material-icons-outlined"
            style={{ fontSize: "4rem", color: theme.primary, animation: "pulse 2s infinite" }}
                  >
                    auto_awesome
                  </span>
                  <h3 style={{ margin: "1rem 0 0.5rem", color: "#111827", fontSize: "1.05rem", fontWeight: "900" }}>
                    Generando Plan...
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
                    La IA esta armando una narrativa completa para que revises primero la propuesta antes de pasar a precios.
                  </p>
                </div>

                <div style={{ width: "100%", height: "4px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    className="progress-bar-fill"
            style={{ height: "100%", background: theme.primary, width: "0%", animation: "loadingProgress 2.5s forwards" }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "1rem 1.1rem",
                    borderRadius: "14px",
                    background: "#ecfdf5",
                    border: "1px solid #86efac",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    className="material-icons-outlined"
                    style={{ color: "#16a34a", fontSize: "1.45rem", lineHeight: 1, marginTop: "0.1rem" }}
                  >
                    auto_awesome
                  </span>
                  <div>
                    <p style={{ margin: 0, color: "#166534", fontWeight: "900", fontSize: "0.96rem" }}>
                      La IA ya preparo la base del plan
                    </p>
                    <p style={{ margin: "0.2rem 0 0", color: "#166534", fontSize: "0.82rem", lineHeight: "1.45" }}>
                      Revisa y edita esta propuesta antes de continuar con tarifas, temporadas e imagenes.
                    </p>
                  </div>
                </div>
                <div style={{ maxHeight: "45vh", overflowY: "auto", paddingRight: "0.2rem", display: "grid", gap: "0.9rem" }}>
                  <div style={{ padding: "1rem", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 0.35rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Titulo generado
                    </p>
                    <input
                      type="text"
                      value={editableGeneratedTitle}
                      onChange={(event) => setEditableGeneratedTitle(event.target.value)}
                      style={{ ...inputStyle, color: "#0f172a", fontWeight: "900" }}
                    />
                  </div>

                  <div style={{ padding: "1rem", borderRadius: "14px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 0.35rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Descripcion breve
                    </p>
                    <textarea
                      value={editableShortDescription}
                      onChange={(event) => setEditableShortDescription(event.target.value)}
                      rows={4}
                      style={{ ...inputStyle, color: "#334155", lineHeight: "1.55", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ padding: "1rem", borderRadius: "14px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 0.35rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Descripcion general
                    </p>
                    <textarea
                      value={editableOverview}
                      onChange={(event) => setEditableOverview(event.target.value)}
                      rows={7}
                      style={{ ...inputStyle, color: "#334155", lineHeight: "1.55", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ padding: "0.95rem", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                      <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase" }}>
                        Dias
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontSize: "1rem", fontWeight: "900" }}>
                        {Array.isArray(aiData.itinerario) ? aiData.itinerario.length : numeroDias}
                      </p>
                    </div>
                    <div style={{ padding: "0.95rem", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                      <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase" }}>
                        Incluye
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontSize: "1rem", fontWeight: "900" }}>
                        {Array.isArray(aiData.que_incluye) ? aiData.que_incluye.length : 0}
                      </p>
                    </div>
                    <div style={{ padding: "0.95rem", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                      <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase" }}>
                        Politicas
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontSize: "1rem", fontWeight: "900" }}>
                        {Array.isArray(aiData.politicas) ? aiData.politicas.length : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <button onClick={() => setStep(2)} style={buttonStyleSecondary}>
                    Volver
                  </button>
                  <button onClick={() => setStep(4)} style={{ ...buttonStylePrimary, flex: 2 }}>
                    Continuar a Tarifas
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ background: "#f0fdf4", padding: "1.2rem", borderRadius: "16px", border: "1px solid #dcfce7", marginBottom: "1.2rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", color: "#166534", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-icons-outlined">bedtime</span>
                Tarifas Temporada Baja
              </h4>

              <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: "800", color: "#166534", opacity: 0.8 }}>
                PRECIO INDIVIDUAL
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
                <input type="number" placeholder="Adulto $" value={pricesLow.adult} onChange={(event) => setPricesLow({ ...pricesLow, adult: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Nino $" value={pricesLow.child} onChange={(event) => setPricesLow({ ...pricesLow, child: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Bebe $" value={pricesLow.baby} onChange={(event) => setPricesLow({ ...pricesLow, baby: event.target.value })} style={inputStyle} />
              </div>

              <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: "800", color: "#166534", opacity: 0.8 }}>
                PRECIO GRUPAL
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                <input type="number" placeholder="Adulto $" value={pricesLowGroup.adult} onChange={(event) => setPricesLowGroup({ ...pricesLowGroup, adult: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Nino $" value={pricesLowGroup.child} onChange={(event) => setPricesLowGroup({ ...pricesLowGroup, child: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Bebe $" value={pricesLowGroup.baby} onChange={(event) => setPricesLowGroup({ ...pricesLowGroup, baby: event.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "1.2rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-icons-outlined">sunny</span>
                Tarifas Temporada Alta
              </h4>

              <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: "800", color: "#0f172a", opacity: 0.8 }}>
                PRECIO INDIVIDUAL
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
                <input type="number" placeholder="Adulto $" value={pricesHigh.adult} onChange={(event) => setPricesHigh({ ...pricesHigh, adult: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Nino $" value={pricesHigh.child} onChange={(event) => setPricesHigh({ ...pricesHigh, child: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Bebe $" value={pricesHigh.baby} onChange={(event) => setPricesHigh({ ...pricesHigh, baby: event.target.value })} style={inputStyle} />
              </div>

              <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: "800", color: "#0f172a", opacity: 0.8 }}>
                PRECIO GRUPAL
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                <input type="number" placeholder="Adulto $" value={pricesHighGroup.adult} onChange={(event) => setPricesHighGroup({ ...pricesHighGroup, adult: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Nino $" value={pricesHighGroup.child} onChange={(event) => setPricesHighGroup({ ...pricesHighGroup, child: event.target.value })} style={inputStyle} />
                <input type="number" placeholder="Bebe $" value={pricesHighGroup.baby} onChange={(event) => setPricesHighGroup({ ...pricesHighGroup, baby: event.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(3)} style={buttonStyleSecondary}>
                Volver
              </button>
              <button
                onClick={() => {
                  if (!pricesLow.adult) {
                    showToast("Define al menos la tarifa base de adulto antes de continuar.");
                    return;
                  }
                  setStep(5);
                }}
                style={{ ...buttonStylePrimary, flex: 2 }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.9rem" }}>
                <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Titulo de la temporada</label>
                <input
                  type="text"
                  value={newSeasonTitle}
                  onChange={(event) => setNewSeasonTitle(event.target.value)}
                  placeholder="Ej. Festivos / Receso"
                  style={{ ...inputStyle, padding: "0.65rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.9rem" }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Fecha Inicio</label>
                  <input
                    type="date"
                    value={newSeasonStart}
                    min={today}
                    max={maxDate}
                    onChange={(event) => {
                      setNewSeasonStart(event.target.value);
                      setNewSeasonEnd(event.target.value);
                    }}
                    style={{ ...inputStyle, padding: "0.65rem" }}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Fecha Fin</label>
                  <input
                    type="date"
                    value={newSeasonEnd}
                    min={newSeasonStart || today}
                    max={maxDate}
                    onChange={(event) => setNewSeasonEnd(event.target.value)}
                    style={{ ...inputStyle, padding: "0.65rem" }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSeason}
                disabled={!hasCompleteSeasonDraft}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  background: hasCompleteSeasonDraft ? "#22c55e" : "#e2e8f0",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "0.95rem",
                  cursor: hasCompleteSeasonDraft ? "pointer" : "not-allowed",
                  color: hasCompleteSeasonDraft ? "#ffffff" : "#475569",
                }}
              >
                + Agregar Temporada
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.7rem", borderRadius: "999px", background: "#ecfeff", color: "#155e75", fontSize: "0.78rem", fontWeight: "800" }}>
                <span className="material-icons-outlined" style={{ fontSize: "0.95rem" }}>event</span>
                {seasons.length} temporada{seasons.length === 1 ? "" : "s"} agregada{seasons.length === 1 ? "" : "s"}
              </span>
              {hasCompleteSeasonDraft ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.7rem", borderRadius: "999px", background: "#dcfce7", color: "#166534", fontSize: "0.78rem", fontWeight: "800" }}>
                  Presiona el boton verde para guardarla
                </span>
              ) : null}
            </div>
            {seasons.length > 0 ? (
              <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {seasons.map((season, idx) => (
                  <div
                    key={`${season.title}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.95rem 1rem",
                      borderRadius: "12px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: "800", fontSize: "0.92rem" }}>
                        {season.title}
                      </p>
                      <p style={{ margin: "0.18rem 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                        {season.start} a {season.end}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSeason(idx)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "999px",
                      }}
                    >
                      <span className="material-icons-outlined" style={{ fontSize: "1.15rem" }}>
                        delete
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "12px", background: theme.soft, border: `1px dashed ${theme.surfaceStrong}`, color: theme.accent, fontSize: "0.84rem", lineHeight: "1.5" }}>
                Agrega al menos una temporada especial para que el sistema pueda aplicar las tarifas altas en fechas de mayor demanda.
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(4)} style={buttonStyleSecondary}>
                Volver
              </button>
              <button onClick={handleContinueFromSeasons} style={{ ...buttonStylePrimary, flex: 2 }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ padding: "1rem", borderRadius: "16px", background: "linear-gradient(180deg, #effcf6 0%, #f8fbff 100%)", border: "1px solid #86efac", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem", borderRadius: "999px", background: "#ffffff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "0.78rem", fontWeight: "800" }}>
                  {images.length} foto{images.length === 1 ? "" : "s"} cargada{images.length === 1 ? "" : "s"}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    background: canAddMoreImages ? "#dbeafe" : "#dcfce7",
                    color: canAddMoreImages ? "#1d4ed8" : "#166534",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                    animation: images.length > 0 && canAddMoreImages ? "planImageHintPulse 1.8s ease-in-out infinite" : "none",
                  }}
                >
                  {canAddMoreImages ? `Puedes agregar ${remainingImageSlots} mas` : "Galeria completa"}
                </span>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#166534", marginBottom: "0.55rem", lineHeight: "1.55" }}>
                Sube las mejores escenas del plan. <strong>La imagen 1 sera la principal.</strong>
              </p>
              <p style={{ margin: "0 0 0.9rem", color: "#2563eb", fontSize: "0.82rem", lineHeight: "1.55" }}>
                Aunque ya tengas una foto, conviene sumar imagenes del destino, actividades, alojamiento y momentos clave para vender mejor la experiencia.
              </p>

              {canAddMoreImages ? (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      padding: "1.1rem",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(236,253,245,0.98) 100%)",
                      borderRadius: "16px",
                      border: "1.5px dashed #38bdf8",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "800",
                color: theme.accent,
                      textAlign: "left",
                      width: "100%",
                      boxSizing: "border-box",
                      boxShadow: "0 12px 28px rgba(56, 189, 248, 0.14)",
                    }}
                  >
                    <span
                      className="material-icons-outlined"
                      style={{
                        fontSize: "1.7rem",
                        color: "#2563eb",
                        width: "46px",
                        height: "46px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#ffffff",
                        boxShadow: "0 10px 18px rgba(37, 99, 235, 0.16)",
                      }}
                    >
                      add_photo_alternate
                    </span>
                    <span>
                      <strong style={{ display: "block", fontSize: "0.96rem" }}>Agregar mas imagenes</strong>
                <span style={{ display: "block", marginTop: "0.2rem", color: theme.accent, fontSize: "0.82rem", fontWeight: "500" }}>
                        Muestra paisajes, actividades, alojamiento y la atmosfera general del plan.
                      </span>
                    </span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                </div>
              ) : null}

              {images.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.85rem", marginTop: "0.5rem" }}>
                  {images.map((imgObj, idx) => (
                    <div
                      key={`${imgObj.preview}-${idx}`}
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        overflow: "hidden",
                border: idx === 0 ? `2px solid ${theme.primary}` : "1px solid #e2e8f0",
                        background: "#ffffff",
                        boxShadow: idx === 0 ? "0 16px 28px rgba(16, 185, 129, 0.16)" : "0 10px 18px rgba(15, 23, 42, 0.06)",
                      }}
                    >
                      <img src={imgObj.preview} alt={`prev-${idx}`} style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "rgba(15, 23, 42, 0.72)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "30px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <span className="material-icons-outlined" style={{ fontSize: "1rem" }}>
                          close
                        </span>
                      </button>
                      <div style={{ padding: "0.7rem 0.75rem" }}>
                        <p style={{ margin: 0, color: "#0f172a", fontWeight: "800", fontSize: "0.82rem" }}>
                          Foto {idx + 1} {idx === 0 ? "- Portada" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: "0.5rem", padding: "1rem", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.84rem", lineHeight: "1.5" }}>
                  Sube al menos una imagen para continuar. Si puedes, combina una portada potente con paisajes, actividades y momentos de la experiencia.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(5)} style={buttonStyleSecondary}>
                Volver
              </button>
              <button
                onClick={() => setStep(7)}
                style={{ ...buttonStylePrimary, flex: 2 }}
                disabled={images.length === 0}
              >
                {images.length === 0 ? "Agrega al menos 1 imagen" : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "center" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "56px", color: "#059669", marginBottom: "0.5rem" }}>
                travel_explore
              </span>
            </div>
          <div style={{ padding: "1.5rem", background: theme.soft, border: `2px dashed ${theme.primary}`, borderRadius: "12px", marginBottom: "1.5rem" }}>
              <p style={{ color: "#047857", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
                Llevaremos toda la informacion del plan y la propuesta IA al formulario final para que puedas revisar los ultimos detalles antes de guardarlo.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(6)} style={buttonStyleSecondary}>
                Volver
              </button>
          <button onClick={handleFinishWizard} style={{ ...buttonStylePrimary, flex: 2, background: theme.accent }}>
                Revisar y Guardar Plan
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes loadingProgress { from { width: 0%; } to { width: 100%; } }
          @keyframes planImageHintPulse {
            0%, 100% { transform: translateY(0); box-shadow: 0 0 0 rgba(37, 99, 235, 0); }
            50% { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18); }
          }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
