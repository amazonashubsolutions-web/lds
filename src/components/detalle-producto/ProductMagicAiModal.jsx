import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { productCategories, productSubcategories } from "../../data/productsData";
import { getProductCategoryTheme } from "../../utils/productCategoryThemes";

export default function ProductMagicAiModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  onStartManual, 
  onSwitchToTransport, 
  onSwitchToRestaurant = () => {},
  onSwitchToPlan = () => {},
  onSwitchToExcursion = () => {},
  initialCategory = "",
  initialData = null,
}) {
  const [step, setStep] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const maxDate = oneYearLater.toISOString().split('T')[0];

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [tourName, setTourName] = useState("");
  const [cityName, setCityName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [numeroDias, setNumeroDias] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [aiData, setAiData] = useState(null);
  const [editableGeneratedTitle, setEditableGeneratedTitle] = useState("");
  const [editableShortDescription, setEditableShortDescription] = useState("");
  const [editableOverview, setEditableOverview] = useState("");

  // Step 2 State
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [departurePoint, setDeparturePoint] = useState("");

  // Step 3 State
  const [pricesLow, setPricesLow] = useState({ adult: "", child: "", baby: "" });
  const [pricesHigh, setPricesHigh] = useState({ adult: "", child: "", baby: "" });
  const [pricesLowGroup, setPricesLowGroup] = useState({ adult: "", child: "", baby: "" });
  const [pricesHighGroup, setPricesHighGroup] = useState({ adult: "", child: "", baby: "" });

  // Step 4 State
  const [seasons, setSeasons] = useState([]);

  // Season form state
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonStart, setNewSeasonStart] = useState("");
  const [newSeasonEnd, setNewSeasonEnd] = useState("");

  // Step 5 State (Images)
  const [images, setImages] = useState([]);

  const availableSubcategories = useMemo(
    () =>
      productSubcategories.filter(
        (subcategory) => subcategory.categoryId === selectedCategory,
      ),
    [selectedCategory]
  );
  const hasCompleteSeasonDraft = Boolean(newSeasonTitle && newSeasonStart && newSeasonEnd);
  const remainingImageSlots = Math.max(0, 5 - images.length);
  const canAddMoreImages = remainingImageSlots > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(1);
    setSelectedCategory(initialData?.selectedCategory ?? initialCategory ?? "");
    setSelectedSubcategory(initialData?.selectedSubcategory ?? "");
    setTourName(initialData?.tourName ?? "");
    setCityName(initialData?.cityName ?? "");
    setRegionName(initialData?.regionName ?? "");
    setNumeroDias(initialData?.numeroDias ?? 3);
    setIsGenerating(false);
    setToast(null);
  }, [initialCategory, initialData, isOpen]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!aiData) {
      return;
    }

    setEditableGeneratedTitle(aiData.titulo || tourName || "");
    setEditableShortDescription(aiData.descripcion_breve || "");
    setEditableOverview(Array.isArray(aiData.descripcion_general) ? aiData.descripcion_general.join("\n\n") : "");
  }, [aiData, tourName]);

  if (!isOpen) {
    return null;
  }

  const isActivityWizard = selectedCategory === "actividades";
  const creationNoticeConfig = {
    actividades: {
      ...getProductCategoryTheme("actividades"),
      title: 'Creacion de Producto "Actividades"',
      description: "Ahorra tiempo generando la estructura inicial de tu paseo con ayuda de Inteligencia Artificial.",
    },
    planes: {
      ...getProductCategoryTheme("planes"),
      title: 'Creacion de Producto "Planes"',
      description: "Configura planes de varios dias con itinerarios, temporadas y detalles completos del viaje.",
    },
    excursiones: {
      ...getProductCategoryTheme("excursiones"),
      title: 'Creacion de Producto "Excursiones"',
      description: "Configura expediciones por nivel de confort con itinerarios, tarifas y logica de temporada.",
    },
    transporte: {
      ...getProductCategoryTheme("transporte"),
      title: 'Creacion de Producto "Transporte"',
      description: "Configura servicios de transporte con capacidad, horarios, temporadas y una propuesta guiada por IA.",
    },
    restaurantes: {
      ...getProductCategoryTheme("restaurantes"),
      title: 'Creacion de Producto "Restaurantes"',
      description: "Configura menus, horarios, estilo de cocina y propuesta comercial con ayuda del asistente.",
    },
  };

  const showToast = (message) => {
    setToast({ id: Date.now(), message });
  };

  const renderCreationNotice = (categoryId) => {
    const config = creationNoticeConfig[categoryId];

    if (!config) {
      return null;
    }

    return (
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          textAlign: "center",
          padding: "1rem",
          background: config.soft,
          border: `1px solid ${config.surfaceStrong}`,
          borderRadius: "8px",
          marginBottom: "1rem",
          color: config.accent,
        }}
      >
        <span className="material-icons-outlined" style={{ display: "block", fontSize: "2rem", marginBottom: "0.5rem" }}>
          {config.icon}
        </span>
        <p style={{ margin: 0, fontWeight: "600", fontSize: "0.95rem" }}>
          {config.title}
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
          {config.description}
        </p>
      </div>
    );
  };

  const handleFetchAi = async () => {
    if (!tourName || !cityName || !regionName) return;
    const startedAt = Date.now();
    setAiData(null);
    setIsGenerating(true);
    if (selectedCategory === "actividades") {
      setStep(2);
    }

    try {
      const response = await fetch("/src/data/mockAiResponse.json");
      if (!response.ok) {
        throw new Error(`No se pudo cargar el mock IA (${response.status})`);
      }
      const data = await response.json();
      const elapsed = Date.now() - startedAt;
      const minimumDelay = 2200;
      if (elapsed < minimumDelay) {
        await new Promise((resolve) => window.setTimeout(resolve, minimumDelay - elapsed));
      }
      setAiData(data);
      if (selectedCategory !== "actividades") {
        setStep(2);
      }
    } catch (error) {
      if (selectedCategory === "actividades") {
        setStep(1);
        showToast("No pudimos generar la propuesta IA de la actividad. Intenta nuevamente.");
      }
      console.error("Error fetching AI data", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSeason = () => {
    if (!newSeasonTitle || !newSeasonStart || !newSeasonEnd) {
      showToast("Completa el nombre y las fechas antes de agregar la temporada.");
      return;
    }
    setSeasons([...seasons, { title: newSeasonTitle, start: newSeasonStart, end: newSeasonEnd }]);
    setNewSeasonTitle("");
    setNewSeasonStart("");
    setNewSeasonEnd("");
  };

  const handleRemoveSeason = (indexToRemove) => {
    setSeasons(seasons.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Verificar que no se excedan las 5 imagenes en total
    const limit = 5 - images.length;
    const allowedFiles = files.slice(0, limit);
    
    if (files.length > limit) {
      alert("Puedes seleccionar un máximo de 5 imágenes.");
    }
    
    const newImages = allowedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFinishWizard = () => {
    const finalAiData = isActivityWizard
      ? {
          ...aiData,
          titulo: editableGeneratedTitle,
          descripcion_breve: editableShortDescription,
          descripcion_general: editableOverview
            ? editableOverview
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
            : aiData?.descripcion_general,
        }
      : aiData;

    const wizardData = {
      selectedSubcategory,
      tourName,
      cityName,
      regionName,
      aiData: finalAiData,
      departureTime,
      returnTime,
      departurePoint,
      pricesLow,
      pricesHigh,
      pricesLowGroup,
      pricesHighGroup,
      seasons,
      images
    };
    onGenerate(selectedCategory, wizardData);
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

  const getStepTitle = () => {
    if (isActivityWizard) {
      switch(step) {
        case 1: return "Configuracion Inicial";
        case 2: return !isGenerating && !aiData ? "Generacion con IA ✨" : "Propuesta IA";
        case 3: return "Detalle y Horarios";
        case 4: return "Configuracion de Precios";
        case 5: return "Fechas Especiales";
        case 6: return "Galeria de Imagenes";
        case 7: return "Confirmacion Final";
        default: return "";
      }
    }

    switch(step) {
      case 1: return "Configuración Inicial";
      case 2: return "Detalle y Horarios";
      case 3: return "Configuración de Precios";
      case 4: return "Fechas Especiales";
      case 5: return "Galería de Imágenes";
      case 6: return "Confirmación Final";
      default: return "";
    }
  };

  const renderStepIndicator = () => (
      <div style={{ marginBottom: "1.5rem" }}>
        {isActivityWizard ? (
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.75rem" }}>
            {[1, 2, 3, 4, 5, 6, 7].map((wizardStep) => (
              <div
                key={wizardStep}
                style={{
                  height: "6px",
                  width: "35px",
                  borderRadius: "3px",
                  backgroundColor: wizardStep <= step ? "#F78A00" : "#eee",
                  transition: "background-color 0.3s ease",
                }}
              />
            ))}
          </div>
        ) : null}
        <div style={{ textAlign: "center" }}>
          {isActivityWizard ? (
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: "#F78A00", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>
              Paso {step} de 7
            </p>
          ) : null}
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "900", color: "#0f172a" }}>
            {getStepTitle()}
          </h2>
        </div>
      </div>
  );

  const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const labelStyle = { display: "block", marginBottom: "0.25rem", fontWeight: "600", fontSize: "0.9rem", color: "#444" };
  const buttonStylePrimary = { width: "100%", minWidth: 0, padding: "0.85rem", borderRadius: "8px", border: "none", background: "#F78A00", color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" };
  const buttonStyleSecondary = { width: "auto", minWidth: "132px", padding: "0.85rem 1.15rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

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
          maxWidth: "500px",
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          fontFamily: "inherit",
          textAlign: "center"
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
              background: "#fff7ed",
              border: "1px solid #fdba74",
              color: "#9a3412",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.2rem",
            borderRadius: "50%",
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#666"; }}
          aria-label="Cancelar y salir"
          title="Cancelar creación de producto"
        >
          <span className="material-icons-outlined" style={{ fontSize: "1.5rem" }}>close</span>
        </button>

        {renderStepIndicator()}

        {step === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "36px", color: "#F78A00", marginBottom: "0.5rem" }}>
                auto_awesome
              </span>
            </div>
            
            <div style={{ marginBottom: "1rem", textAlign: "left" }}>
              <label style={labelStyle}>Categoría del producto</label>
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory("");
                }}
                style={inputStyle}
              >
                <option value="" disabled>Selecciona una categoría...</option>
                {productCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {selectedCategory && availableSubcategories.length > 0 && (
              <div style={{ marginBottom: "1rem", textAlign: "left", animation: "fadeIn 0.3s ease" }}>
                <label style={labelStyle}>Subcategoría</label>
                <select 
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  style={inputStyle}
                >
                  <option value="" disabled>Selecciona una subcategoría...</option>
                  {availableSubcategories.map(subcat => (
                    <option key={subcat.id} value={subcat.id}>{subcat.label}</option>
                  ))}
                </select>
              </div>
            )}

            {(selectedCategory === "actividades" || selectedCategory === "planes" || selectedCategory === "excursiones") && (
              <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={labelStyle}>
                    Nombre {selectedCategory === "actividades" ? "del Paseo" : selectedCategory === "excursiones" ? "de la Excursión" : "del Plan"}
                  </label>
                  <input 
                    type="text" 
                    value={tourName}
                    onChange={e => setTourName(e.target.value)}
                    placeholder={
                      selectedCategory === "actividades" ? "Ej. Rafting en el Cañón" : 
                      selectedCategory === "excursiones" ? "Ej. Expedición al corazón de la selva" : 
                      "Ej. Amazonas Mágico"
                    } 
                    style={inputStyle}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Ciudad</label>
                    <input 
                      type="text" 
                      value={cityName}
                      onChange={e => setCityName(e.target.value)}
                      placeholder="Ej. Leticia" 
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Región</label>
                    <input 
                      type="text" 
                      value={regionName}
                      onChange={e => setRegionName(e.target.value)}
                      placeholder="Ej. Amazonas" 
                      style={inputStyle}
                    />
                  </div>
                  {selectedCategory === "excursiones" && (
                    <div style={{ width: "100px" }}>
                      <label style={labelStyle}>Días (Máx 5)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="5"
                        value={numeroDias || 1}
                        onChange={e => setNumeroDias(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>

                {selectedCategory === "actividades" ? (
                  <>
                    {renderCreationNotice("actividades")}
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!tourName || !cityName || !regionName || isGenerating}
                      style={{ ...buttonStylePrimary, background: isGenerating ? "#ccc" : "#F78A00", cursor: (tourName && cityName && regionName && !isGenerating) ? "pointer" : "not-allowed" }}
                    >
                      <>
                        <span className="material-icons-outlined">auto_awesome</span>
                        Generar Actividad con IA
                      </>
                    </button>
                    <button 
                      onClick={() => onStartManual(selectedCategory, { tourName, cityName, regionName, selectedSubcategory })}
                      style={{ width: "100%", padding: "0.75rem", background: "transparent", border: "none", color: "#888", fontWeight: "600", marginTop: "0.5rem", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}
                    >
                      Continuar creación manualmente
                    </button>
                  </>
                ) : selectedCategory === "planes" ? (
                  <div style={{ animation: "fadeIn 0.3s ease" }}>
                    {renderCreationNotice("planes")}
                    <button 
                      onClick={() => onSwitchToPlan({ selectedCategory, selectedSubcategory, tourName, cityName, regionName })}
                      disabled={!tourName || !cityName || !selectedSubcategory}
                      style={{ ...buttonStylePrimary, background: (!tourName || !cityName || !selectedSubcategory) ? "#ccc" : "#3b82f6", cursor: (!tourName || !cityName || !selectedSubcategory) ? "not-allowed" : "pointer" }}
                    >
                      <span className="material-icons-outlined">auto_awesome</span>
                      Iniciar Asistente de Planes
                    </button>
                  </div>
                ) : selectedCategory === "excursiones" ? (
                  <div style={{ animation: "fadeIn 0.3s ease" }}>
                    {renderCreationNotice("excursiones")}
                    <button 
                      onClick={() =>
                        onSwitchToExcursion({
                          selectedCategory,
                          selectedSubcategory,
                          tourName,
                          cityName,
                          regionName,
                          numeroDias,
                        })
                      }
                      disabled={!tourName || !cityName || !selectedSubcategory}
                      style={{ ...buttonStylePrimary, background: (!tourName || !cityName || !selectedSubcategory) ? "#ccc" : "#14b8a6", cursor: (!tourName || !cityName || !selectedSubcategory) ? "not-allowed" : "pointer" }}
                    >
                      <span className="material-icons-outlined">auto_awesome</span>
                      Iniciar Asistente de Excursiones
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {selectedCategory === "transporte" ? (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                {renderCreationNotice("transporte")}
                <button 
                  onClick={() => onSwitchToTransport({ 
                    selectedCategory, 
                    selectedSubcategory, 
                    tourName, 
                    cityName, 
                    regionName 
                  })}
                  style={{ ...buttonStylePrimary, background: "#10b981" }}
                >
                  <span className="material-icons-outlined">open_in_new</span>
                  Iniciar Asistente de Transporte
                </button>
              </div>
            ) : selectedCategory === "restaurantes" ? (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                {renderCreationNotice("restaurantes")}
                <button 
                  onClick={() => onSwitchToRestaurant({ 
                    selectedCategory, 
                    selectedSubcategory, 
                    tourName, 
                    cityName, 
                    regionName 
                  })}
                  style={{ ...buttonStylePrimary, background: "#f59e0b" }}
                >
                  <span className="material-icons-outlined">open_in_new</span>
                  Iniciar Asistente de Restaurante
                </button>
              </div>
            ) : selectedCategory !== "" && selectedCategory !== "actividades" && selectedCategory !== "planes" && selectedCategory !== "excursiones" ? (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <div style={{ padding: "1rem", background: "#f0f4f8", borderRadius: "8px", marginBottom: "1rem", color: "#00357f" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>construction</span>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "0.95rem" }}>
                    ¡Pronto habilitaremos la IA para este tipo de producto!
                  </p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                    Por ahora, continuaremos de forma manual.
                  </p>
                </div>
                <button 
                  onClick={() => onStartManual(selectedCategory, { tourName, cityName, regionName, selectedSubcategory })}
                  style={buttonStyleSecondary}
                >
                  Continuar Manualmente
                </button>
              </div>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            {!isGenerating && !aiData ? (
              <div style={{ animation: "fadeIn 0.3s ease", padding: "1rem 0" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "4rem", color: "#F78A00", animation: "pulse 2s infinite" }}>
                    auto_awesome
                  </span>
                  <h3 style={{ margin: "1rem 0 0.5rem", color: "#111827", fontSize: "1.05rem", fontWeight: "900" }}>
                    Listo para Generar
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
                    Nuestro experto IA creará una narrativa turística completa basada en el nombre del paseo y su destino.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <button onClick={() => setStep(1)} style={buttonStyleSecondary}>Ajustar Datos</button>
                  <button onClick={handleFetchAi} style={{ ...buttonStylePrimary, flex: 2 }}>Generar con IA ahora</button>
                </div>
              </div>
            ) : isGenerating ? (
              <div style={{ padding: "1rem 0.2rem 0.25rem", textAlign: "center" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "4rem", color: "#F78A00", animation: "pulse 2s infinite" }}>
                    auto_awesome
                  </span>
                  <h3 style={{ margin: "1rem 0 0.5rem", color: "#111827", fontSize: "1.05rem", fontWeight: "900" }}>
                    Generando Experiencia...
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
                    Nuestro experto IA creará una narrativa turística completa basada en el nombre del paseo y su destino.
                  </p>
                </div>

                <div style={{ width: "100%", height: "4px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    className="progress-bar-fill"
                    style={{ height: "100%", background: "#F78A00", width: "0%", animation: "loadingProgress 2.5s forwards" }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "1rem 1.1rem",
                    borderRadius: "14px",
                    background: "#ecfdf3",
                    border: "1px solid #86efac",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <span className="material-icons-outlined" style={{ color: "#16a34a", fontSize: "1.45rem", lineHeight: 1, marginTop: "0.1rem" }}>
                    auto_awesome
                  </span>
                  <div>
                    <p style={{ margin: 0, color: "#166534", fontWeight: "900", fontSize: "0.96rem" }}>
                      La IA ya preparo la base de la actividad
                    </p>
                    <p style={{ margin: "0.2rem 0 0", color: "#166534", fontSize: "0.82rem", lineHeight: "1.45" }}>
                      Revisa este resumen antes de continuar con horarios, precios, temporadas e imagenes.
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
                      onChange={(e) => setEditableGeneratedTitle(e.target.value)}
                      style={{ ...inputStyle, color: "#0f172a", fontWeight: "900" }}
                    />
                  </div>

                  <div style={{ padding: "1rem", borderRadius: "14px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 0.35rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Descripcion breve
                    </p>
                    <textarea
                      value={editableShortDescription}
                      onChange={(e) => setEditableShortDescription(e.target.value)}
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
                      onChange={(e) => setEditableOverview(e.target.value)}
                      rows={7}
                      style={{ ...inputStyle, color: "#334155", lineHeight: "1.55", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ padding: "0.95rem", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                      <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase" }}>
                        Itinerario
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontSize: "1rem", fontWeight: "900" }}>
                        {Array.isArray(aiData.itinerario) ? aiData.itinerario.length : 0}
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
                  <button onClick={() => setStep(1)} style={buttonStyleSecondary}>Volver</button>
                  <button onClick={() => setStep(3)} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar a Horarios</button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ padding: "0.8rem", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "8px", marginBottom: "1.5rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", color: "#2e7d32", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span className="material-icons-outlined" style={{ fontSize: "1.2rem" }}>check_circle</span>
                ¡Genial! Campos diligenciados
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#1b5e20", lineHeight: "1.5" }}>
                La IA ha traído exitosamente: <strong>Título, Resumen, Descripción general, Itinerario completo, Inclusiones, Recomendaciones y Políticas de cancelación.</strong>
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Hora salida</label>
                <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hora de regreso</label>
                <input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>Punto de encuentro</label>
              <input type="text" value={departurePoint} onChange={e => setDeparturePoint(e.target.value)} placeholder="Ej. Parque central" style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(2)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={() => setStep(4)} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>

            <div style={{ maxHeight: "40vh", overflowY: "auto", paddingRight: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#333", fontSize: "0.95rem" }}>Temporada Baja</h4>
                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "600", display: "inline-block", marginBottom: "0.3rem" }}>Precio Individual</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <input type="number" placeholder="Adulto $" value={pricesLow.adult} onChange={e => setPricesLow({...pricesLow, adult: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Niño $" value={pricesLow.child} onChange={e => setPricesLow({...pricesLow, child: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Bebé $" value={pricesLow.baby} onChange={e => setPricesLow({...pricesLow, baby: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "600", display: "inline-block", marginBottom: "0.3rem" }}>Precio Grupo (6+)</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <input type="number" placeholder="Adulto $" value={pricesLowGroup.adult} onChange={e => setPricesLowGroup({...pricesLowGroup, adult: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Niño $" value={pricesLowGroup.child} onChange={e => setPricesLowGroup({...pricesLowGroup, child: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Bebé $" value={pricesLowGroup.baby} onChange={e => setPricesLowGroup({...pricesLowGroup, baby: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#fff5e6", padding: "1rem", borderRadius: "8px", border: "1px solid #fbd38d" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#9c4221", fontSize: "0.95rem" }}>Temporada Alta</h4>
                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#c2410c", fontWeight: "600", display: "inline-block", marginBottom: "0.3rem" }}>Precio Individual</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <input type="number" placeholder="Adulto $" value={pricesHigh.adult} onChange={e => setPricesHigh({...pricesHigh, adult: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Niño $" value={pricesHigh.child} onChange={e => setPricesHigh({...pricesHigh, child: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Bebé $" value={pricesHigh.baby} onChange={e => setPricesHigh({...pricesHigh, baby: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#c2410c", fontWeight: "600", display: "inline-block", marginBottom: "0.3rem" }}>Precio Grupo (6+)</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <input type="number" placeholder="Adulto $" value={pricesHighGroup.adult} onChange={e => setPricesHighGroup({...pricesHighGroup, adult: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Niño $" value={pricesHighGroup.child} onChange={e => setPricesHighGroup({...pricesHighGroup, child: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                    <div>
                      <input type="number" placeholder="Bebé $" value={pricesHighGroup.baby} onChange={e => setPricesHighGroup({...pricesHighGroup, baby: e.target.value})} style={{...inputStyle, padding: "0.4rem", fontSize: "0.85rem"}} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "0.8rem", background: "#f0f4f8", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "#444" }}>Precio Base del Paseo:</span>
              <strong style={{ fontSize: "1.1rem", color: "#00357f" }}>$ {pricesLow.adult || 0}</strong>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(3)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={() => setStep(5)} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>

            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{...labelStyle, fontSize: "0.8rem"}}>Título Fecha (Ej: Navidad)</label>
                <input type="text" value={newSeasonTitle} onChange={e => setNewSeasonTitle(e.target.value)} style={{...inputStyle, padding: "0.5rem"}} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.8rem" }}>
                <div>
                  <label style={{...labelStyle, fontSize: "0.8rem"}}>Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={newSeasonStart} 
                    min={today}
                    max={maxDate}
                    onChange={e => {
                      setNewSeasonStart(e.target.value);
                      setNewSeasonEnd(e.target.value);
                    }} 
                    style={{...inputStyle, padding: "0.5rem"}} 
                  />
                </div>
                <div>
                  <label style={{...labelStyle, fontSize: "0.8rem"}}>Fecha Fin</label>
                  <input 
                    type="date" 
                    value={newSeasonEnd} 
                    min={newSeasonStart || today}
                    max={maxDate}
                    onChange={e => setNewSeasonEnd(e.target.value)} 
                    style={{...inputStyle, padding: "0.5rem"}} 
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
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "999px",
                  background: "#fff7ed",
                  color: "#c2410c",
                  fontSize: "0.78rem",
                  fontWeight: "800",
                }}
              >
                <span className="material-icons-outlined" style={{ fontSize: "0.95rem" }}>event</span>
                {seasons.length} temporada{seasons.length === 1 ? "" : "s"} agregada{seasons.length === 1 ? "" : "s"}
              </span>
              {hasCompleteSeasonDraft ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "999px",
                    background: "#dcfce7",
                    color: "#166534",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                  }}
                >
                  Presiona el boton verde para guardarla
                </span>
              ) : null}
            </div>

            {seasons.length > 0 ? (
              <div style={{ marginBottom: "1.5rem" }}>
                {seasons.map((season, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.95rem 1rem",
                      borderRadius: "12px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: "800", fontSize: "0.92rem" }}>{season.title}</p>
                      <p style={{ margin: "0.18rem 0 0", color: "#64748b", fontSize: "0.82rem" }}>{season.start} a {season.end}</p>
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
                      <span className="material-icons-outlined" style={{ fontSize: "1.15rem" }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#fff7ed",
                  border: "1px dashed #fdba74",
                  color: "#9a3412",
                  fontSize: "0.84rem",
                  lineHeight: "1.5",
                }}
              >
                Agrega al menos una temporada especial para que el sistema pueda diferenciar las fechas de mayor demanda.
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(4)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={handleContinueFromSeasons} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>

            <div style={{ padding: "1rem", borderRadius: "16px", background: "linear-gradient(180deg, #effcf6 0%, #f8fbff 100%)", border: "1px solid #86efac", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    background: "#ffffff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                  }}
                >
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
                    animation: images.length > 0 && canAddMoreImages ? "activityImageHintPulse 1.8s ease-in-out infinite" : "none",
                  }}
                >
                  {canAddMoreImages ? `Puedes agregar ${remainingImageSlots} mas` : "Galeria completa"}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#166534", marginBottom: "0.55rem", lineHeight: "1.55" }}>
                Sube de 1 a 5 imágenes relacionadas al producto. <strong>La imagen 1 será la de portada.</strong>
              </p>

              <p style={{ margin: "0 0 0.9rem", color: "#2563eb", fontSize: "0.82rem", lineHeight: "1.55" }}>
                Aunque ya tengas una foto, conviene sumar mas imagenes para mostrar ambiente, actividades, paisaje y detalles del recorrido.
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
                        color: "#0f766e",
                       textAlign: "left",
                       width: "100%",
                       boxSizing: "border-box",
                        boxShadow: "0 12px 28px rgba(56, 189, 248, 0.14)"
                     }}
                   >
                      <span className="material-icons-outlined" style={{ fontSize: "1.7rem", color: "#2563eb", width: "46px", height: "46px", borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#ffffff", boxShadow: "0 10px 18px rgba(37, 99, 235, 0.16)" }}>add_photo_alternate</span>
                     Seleccionar Imágenes
                     <input 
                       type="file" 
                       accept="image/*" 
                       multiple 
                       onChange={handleImageChange} 
                       style={{ display: "none" }} 
                     />
                   </label>
                </div>
              ) : null}

              {images.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.85rem", marginTop: "0.5rem" }}>
                  {images.map((imgObj, idx) => (
                    <div key={idx} style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: idx === 0 ? "2px solid #F78A00" : "1px solid #e2e8f0", background: "#ffffff", boxShadow: idx === 0 ? "0 16px 28px rgba(247, 138, 0, 0.14)" : "0 10px 18px rgba(15, 23, 42, 0.06)" }}>
                      <img src={imgObj.preview} alt={`preview-${idx}`} style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }} />
                      <button 
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
                          padding: 0
                        }}
                      >
                        <span className="material-icons-outlined" style={{ fontSize: "1rem" }}>close</span>
                      </button>
                      <div style={{ padding: "0.7rem 0.75rem" }}>
                        <p style={{ margin: 0, color: "#0f172a", fontWeight: "800", fontSize: "0.82rem" }}>
                          Foto {idx + 1} {idx === 0 ? "• Portada" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b",
                    fontSize: "0.84rem",
                    lineHeight: "1.5",
                  }}
                >
                  Sube al menos una imagen para continuar. Si puedes, combina una portada potente con fotos del entorno y del tipo de experiencia que ofreces.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(5)} style={buttonStyleSecondary}>Volver</button>
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
              <span className="material-icons-outlined" style={{ fontSize: "56px", color: "#2e7d32", marginBottom: "0.5rem" }}>
                playlist_add_check_circle
              </span>
            </div>

            <div style={{ padding: "1.5rem", background: "#fffbeb", border: "2px dashed #F59E0B", borderRadius: "12px", marginBottom: "1.5rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "64px", color: "#F59E0B", marginBottom: "0.5rem" }}>
                warning_amber
              </span>
              <h3 style={{ margin: "0 0 0.8rem 0", color: "#92400e", fontSize: "1.1rem" }}>¡Atención antes de finalizar!</h3>
              
              <p style={{ color: "#b45309", fontSize: "0.95rem", lineHeight: "1.5", margin: "0" }}>
                Al presionar el botón abajo, serás llevado al formulario detallado. <strong>Por favor, revisa cuidadosamente toda la información</strong> que la IA ha generado para asegurar que no haya errores o detalles que omitir.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(6)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={handleFinishWizard} style={{ ...buttonStylePrimary, flex: 2, background: "#0d3b66" }}>Entendido, ir a revisar y crear</button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes loadingProgress { from { width: 0%; } to { width: 100%; } }
          @keyframes activityAiSpin { 100% { transform: rotate(360deg); } }
          @keyframes activityImageHintPulse {
            0%, 100% { transform: translateY(0); box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
            50% { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(245, 158, 11, 0.18); }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
