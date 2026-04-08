import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { productSubcategories } from "../../data/productsData";
import { getProductCategoryTheme } from "../../utils/productCategoryThemes";

export default function ProductRestaurantMagicAiModal({
  isOpen,
  onClose,
  onGenerate,
  onStartManual,
  initialData,
  onBackToSetup,
}) {
  const theme = getProductCategoryTheme("restaurantes");
  const [step, setStep] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const maxDate = oneYearLater.toISOString().split('T')[0];

  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [cityName, setCityName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [aiData, setAiData] = useState(null);
  const [editableGeneratedTitle, setEditableGeneratedTitle] = useState("");
  const [editableShortDescription, setEditableShortDescription] = useState("");
  const [editableServiceType, setEditableServiceType] = useState("");
  const [editableLocation, setEditableLocation] = useState("");
  const [editableExperience, setEditableExperience] = useState("");

  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.selectedSubcategory) setSelectedSubcategory(initialData.selectedSubcategory);
      if (initialData.tourName) setRestaurantName(initialData.tourName);
      if (initialData.cityName) setCityName(initialData.cityName);
      if (initialData.regionName) setRegionName(initialData.regionName);
    }

    if (isOpen) {
      const hasPrefilledBaseData = Boolean(
        initialData?.selectedSubcategory &&
          initialData?.tourName &&
          initialData?.cityName &&
          initialData?.regionName,
      );

      setStep(hasPrefilledBaseData ? 2 : 1);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  // Foodie Specifics (Step 2)
  const [foodStyle, setFoodStyle] = useState(""); 
  const [serviceFormat, setServiceFormat] = useState(""); 
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");

  useEffect(() => {
    if (!aiData) {
      return;
    }

    setEditableGeneratedTitle(aiData.titulo || restaurantName || "");
    setEditableShortDescription(aiData.descripcion_breve || "");
    setEditableServiceType(aiData.tipo_servicio || serviceFormat || "");
    setEditableLocation(aiData.ubicacion || `${cityName}${regionName ? `, ${regionName}` : ""}`);
    setEditableExperience(aiData.experiencia_servicio?.descripcion || "");
  }, [aiData, cityName, regionName, restaurantName, serviceFormat]);

  // Prices (Step 3)
  const [pricesLow, setPricesLow] = useState({ adult: "", child: "", baby: "" });
  const [pricesHigh, setPricesHigh] = useState({ adult: "", child: "", baby: "" });
  const [pricesLowGroup, setPricesLowGroup] = useState({ adult: "", child: "", baby: "" });
  const [pricesHighGroup, setPricesHighGroup] = useState({ adult: "", child: "", baby: "" });

  // Seasons (Step 4)
  const [seasons, setSeasons] = useState([]);
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonStart, setNewSeasonStart] = useState("");
  const [newSeasonEnd, setNewSeasonEnd] = useState("");

  // Images (Step 5)
  const [images, setImages] = useState([]);

  const availableSubcategories = useMemo(
    () =>
      productSubcategories.filter(
        (subcategory) => subcategory.categoryId === "restaurantes",
      ),
    []
  );
  const selectedSubcategoryLabel =
    availableSubcategories.find((subcategory) => subcategory.id === selectedSubcategory)?.label ?? "";
  const hasCompleteSeasonDraft = Boolean(newSeasonTitle && newSeasonStart && newSeasonEnd);
  const remainingImageSlots = Math.max(0, 5 - images.length);
  const canAddMoreImages = remainingImageSlots > 0;

  if (!isOpen) return null;

  const showToast = (message) => {
    setToast({ id: Date.now(), message });
  };

  const handleFetchAi = async () => {
    if (
      !selectedSubcategory ||
      !restaurantName ||
      !cityName ||
      !regionName ||
      !serviceFormat ||
      !foodStyle ||
      !openingTime ||
      !closingTime
    ) {
      return;
    }
    setAiData(null);
    setIsGenerating(true);
    setStep(3);
    
    // Simulate AI generation with collected variables
    setTimeout(async () => {
      try {
        const response = await fetch("/src/data/mockAiResponseRestaurante.json");
        if (!response.ok) {
          throw new Error(`No se pudo cargar el mock IA de restaurantes (${response.status})`);
        }
        const data = await response.json();
        setAiData(data);
        setIsGenerating(false);
      } catch (error) {
        setIsGenerating(false);
        setStep(2);
        showToast("No pudimos generar la propuesta IA de restaurante. Intenta nuevamente.");
        console.error("Error fetching Restaurant AI data", error);
      }
    }, 2000);
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
    const finalAiData = {
      ...aiData,
      titulo: editableGeneratedTitle,
      descripcion_breve: editableShortDescription,
      tipo_servicio: editableServiceType,
      ubicacion: editableLocation,
      experiencia_servicio: {
        ...(aiData?.experiencia_servicio || {}),
        descripcion: editableExperience,
      },
    };

    const wizardData = {
      selectedSubcategory,
      tourName: restaurantName, 
      cityName,
      regionName,
      aiData: finalAiData,
      foodStyle,
      serviceFormat,
      openingTime,
      closingTime,
      departureTime: openingTime, 
      returnTime: closingTime,
      pricesLow,
      pricesHigh,
      pricesLowGroup,
      pricesHighGroup,
      seasons,
      images
    };
    onGenerate("restaurantes", wizardData);
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

  const handleBackToSetup = () => {
    const nextInitialData = {
      selectedCategory: "restaurantes",
      selectedSubcategory,
      tourName: restaurantName,
      cityName,
      regionName,
    };

    if (onBackToSetup) {
      onBackToSetup(nextInitialData);
      return;
    }

    onClose();
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Información del Restaurante";
      case 2: return "Estilo y Horarios";
      case 3: return "Propuesta IA";
      case 4: return "Precios del Menú";
      case 5: return "Fechas Especiales";
      case 6: return "Galería de Imágenes";
      case 7: return "Confirmación Final";
      default: return "";
    }
  };

  const renderStepIndicator = () => (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        {[1, 2, 3, 4, 5, 6, 7].map(s => (
          <div key={s} style={{ 
            height: "6px", 
            width: "35px", 
            borderRadius: "3px", 
                backgroundColor: s <= step ? theme.primary : "#eee",
            transition: "background-color 0.3s ease"
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: theme.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>
          Paso {step} de 7
        </p>
        <h2 style={{ margin: 0, color: "#111", fontSize: "1.25rem", fontWeight: "800" }}>
          {getStepTitle()}
        </h2>
      </div>
    </div>
  );

  const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const labelStyle = { display: "block", marginBottom: "0.25rem", fontWeight: "600", fontSize: "0.9rem", color: "#444" };
  const buttonStylePrimary = { width: "100%", minWidth: 0, padding: "0.85rem", borderRadius: "8px", border: "none", background: theme.primary, color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" };
  const buttonStyleSecondary = { width: "auto", minWidth: "132px", padding: "0.85rem 1.15rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

  return createPortal(
    <div
      className="product-magic-ai-backdrop"
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        className="product-magic-ai-modal"
        style={{
          position: "relative", background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "1.5rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", textAlign: "center"
        }}
        onClick={(e) => e.stopPropagation()}
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

        <button onClick={onClose} style={{ position: "absolute", top: "1.2rem", right: "1.2rem", background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>
          <span className="material-icons-outlined">close</span>
        </button>

        {renderStepIndicator()}

        {step === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            {initialData?.selectedSubcategory ? (
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={labelStyle}>Subcategoria</label>
                <div
                  style={{
                    ...inputStyle,
                    background: "#f8fafc",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    minHeight: "48px",
                    fontWeight: "600",
                  }}
                >
                  {selectedSubcategoryLabel || "Subcategoria seleccionada"}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={labelStyle}>Subcategoria</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Seleccionar subcategoria...</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Nombre del Restaurante</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ej. Sabores de la Triple Frontera"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="Ej. Leticia"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Region</label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  placeholder="Ej. Amazonas"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handleBackToSetup} style={buttonStyleSecondary}>Volver</button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedSubcategory || !restaurantName || !cityName || !regionName}
                style={{ ...buttonStylePrimary, flex: 2, opacity: !selectedSubcategory || !restaurantName || !cityName || !regionName ? 0.65 : 1 }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Estilo de Comida</label>
              <select value={foodStyle} onChange={e => setFoodStyle(e.target.value)} style={inputStyle}>
                <option value="">Seleccionar estilo...</option>
                <option value="Brasileña">Brasileña</option>
                <option value="Colombiana">Colombiana</option>
                <option value="Amazónica">Amazónica</option>
                <option value="Internacional">Internacional</option>
                <option value="Fusión">Fusión</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Formato del Servicio</label>
              <select value={serviceFormat} onChange={e => setServiceFormat(e.target.value)} style={inputStyle}>
                <option value="">Seleccionar formato...</option>
                <option value="Buffet">Buffet</option>
                <option value="A la carta">A la carta</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Apertura</label>
                <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cierre</label>
                <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep(1)} style={buttonStyleSecondary}>Volver</button>
              <button 
                onClick={handleFetchAi} 
                disabled={
                  !selectedSubcategory ||
                  !restaurantName ||
                  !cityName ||
                  !regionName ||
                  !foodStyle ||
                  !serviceFormat ||
                  !openingTime ||
                  !closingTime ||
                  isGenerating
                }
                style={{ ...buttonStylePrimary, flex: 2 }}
              >
                {isGenerating ? "Generando con IA..." : "Generar con IA ✨"}
              </button>
            </div>

            {isGenerating ? (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem 1.1rem",
                  borderRadius: "14px",
      background: `linear-gradient(135deg, ${theme.softAlt} 0%, ${theme.soft} 100%)`,
                  border: "1px solid #fdba74",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.9rem",
                  boxShadow: "0 14px 28px rgba(249, 115, 22, 0.12)",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "999px",
                    border: "3px solid rgba(247, 138, 0, 0.22)",
        borderTopColor: theme.primary,
                    animation: "restaurantAiSpin 0.9s linear infinite",
                    flexShrink: 0,
                  }}
                />
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, color: "#9a3412", fontWeight: "800", fontSize: "0.95rem" }}>
                    Preparando la propuesta gastronómica
                  </p>
                  <p style={{ margin: "0.2rem 0 0", color: "#7c2d12", fontSize: "0.82rem", lineHeight: "1.45" }}>
                    La IA está organizando estilo de cocina, servicio, descripción y estructura base del restaurante.
                  </p>
                </div>
              </div>
            ) : null}
            
            <button 
              onClick={() => onStartManual("restaurantes", { tourName: restaurantName, cityName, regionName, selectedSubcategory, foodStyle, serviceFormat, openingTime, closingTime })} 
              style={{ width: "100%", padding: "0.75rem", background: "transparent", border: "none", color: "#888", fontWeight: "600", marginTop: "1rem", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}
            >
              Continuar manualmente
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            {isGenerating || !aiData ? (
              <div
                style={{
                  padding: "1.4rem",
                  borderRadius: "16px",
      background: `linear-gradient(135deg, ${theme.softAlt} 0%, ${theme.soft} 100%)`,
                  border: "1px solid #fdba74",
                  boxShadow: "0 18px 36px rgba(249, 115, 22, 0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "999px",
                      border: "4px solid rgba(247, 138, 0, 0.2)",
          borderTopColor: theme.primary,
                      animation: "restaurantAiSpin 0.9s linear infinite",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, color: "#9a3412", fontWeight: "900", fontSize: "1rem" }}>
                      Generando la propuesta IA del restaurante
                    </p>
                    <p style={{ margin: "0.25rem 0 0", color: "#7c2d12", fontSize: "0.84rem", lineHeight: "1.45" }}>
                      Estamos construyendo descripcion, experiencia, ubicacion y estructura del servicio para que el resultado se vea mas realista.
                    </p>
                  </div>
                </div>
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  {[
                    "Analizando subcategoria y estilo gastronomico",
                    "Redactando propuesta base para plataforma turistica",
                    "Organizando experiencia, incluye y recomendaciones",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        padding: "0.8rem 0.95rem",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.7)",
                        color: "#9a3412",
                        fontSize: "0.84rem",
                        fontWeight: "700",
                        animation: "fadeIn 0.45s ease",
                      }}
                    >
                      {item}
                    </div>
                  ))}
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
                  <span
                    className="material-icons-outlined"
                    style={{ color: "#16a34a", fontSize: "1.45rem", lineHeight: 1, marginTop: "0.1rem" }}
                  >
                    auto_awesome
                  </span>
                  <div>
                    <p style={{ margin: 0, color: "#166534", fontWeight: "900", fontSize: "0.96rem" }}>
                      La IA ya preparo la base del restaurante
                    </p>
                    <p style={{ margin: "0.2rem 0 0", color: "#166534", fontSize: "0.82rem", lineHeight: "1.45" }}>
                      Revisa este resumen antes de continuar con precios, temporadas e imagenes.
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ padding: "0.95rem", borderRadius: "14px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <p style={{ margin: "0 0 0.3rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Tipo de servicio
                      </p>
                      <input
                        type="text"
                        value={editableServiceType}
                        onChange={(e) => setEditableServiceType(e.target.value)}
                        style={{ ...inputStyle, color: "#334155", fontWeight: "700" }}
                      />
                    </div>
                    <div style={{ padding: "0.95rem", borderRadius: "14px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <p style={{ margin: "0 0 0.3rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Ubicacion
                      </p>
                      <input
                        type="text"
                        value={editableLocation}
                        onChange={(e) => setEditableLocation(e.target.value)}
                        style={{ ...inputStyle, color: "#334155", fontWeight: "700" }}
                      />
                    </div>
                  </div>

                  {aiData.experiencia_servicio?.descripcion ? (
                    <div style={{ padding: "1rem", borderRadius: "14px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <p style={{ margin: "0 0 0.35rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Experiencia / servicio
                      </p>
                      <textarea
                        value={editableExperience}
                        onChange={(e) => setEditableExperience(e.target.value)}
                        rows={5}
                        style={{ ...inputStyle, color: "#334155", lineHeight: "1.55", resize: "vertical" }}
                      />
                    </div>
                  ) : null}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
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
                        Recomendaciones
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontSize: "1rem", fontWeight: "900" }}>
                        {Array.isArray(aiData.recomendaciones) ? aiData.recomendaciones.length : 0}
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
                  <button onClick={() => setStep(2)} style={buttonStyleSecondary}>Volver</button>
                  <button onClick={() => setStep(4)} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar a Precios</button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ maxHeight: "45vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              
              {/* Temporada Baja */}
              <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "12px", border: "1px solid #ddd", marginBottom: "1.2rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", fontSize: "1rem", color: "#2e7d32", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "1.1rem" }}>sunny</span>
                  Temporada Baja
                </h4>
                
                <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", fontWeight: "700", color: "#666" }}>INDIVIDUAL</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.8rem" }}>
                  <input type="number" placeholder="Adulto $" value={pricesLow.adult} onChange={e => setPricesLow({...pricesLow, adult: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Niño $" value={pricesLow.child} onChange={e => setPricesLow({...pricesLow, child: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Bebé $" value={pricesLow.baby} onChange={e => setPricesLow({...pricesLow, baby: e.target.value})} style={inputStyle} />
                </div>

                <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", fontWeight: "700", color: "#666" }}>GRUPAL</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <input type="number" placeholder="Adulto $" value={pricesLowGroup.adult} onChange={e => setPricesLowGroup({...pricesLowGroup, adult: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Niño $" value={pricesLowGroup.child} onChange={e => setPricesLowGroup({...pricesLowGroup, child: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Bebé $" value={pricesLowGroup.baby} onChange={e => setPricesLowGroup({...pricesLowGroup, baby: e.target.value})} style={inputStyle} />
                </div>
              </div>

              {/* Temporada Alta */}
              <div style={{ background: "#fff5e6", padding: "1rem", borderRadius: "12px", border: "1px solid #fbd38d" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", fontSize: "1rem", color: "#c2410c", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "1.1rem" }}>trending_up</span>
                  Temporada Alta
                </h4>

                <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", fontWeight: "700", color: "#c2410c" }}>INDIVIDUAL</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.8rem" }}>
                  <input type="number" placeholder="Adulto $" value={pricesHigh.adult} onChange={e => setPricesHigh({...pricesHigh, adult: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Niño $" value={pricesHigh.child} onChange={e => setPricesHigh({...pricesHigh, child: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Bebé $" value={pricesHigh.baby} onChange={e => setPricesHigh({...pricesHigh, baby: e.target.value})} style={inputStyle} />
                </div>

                <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", fontWeight: "700", color: "#c2410c" }}>GRUPAL</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <input type="number" placeholder="Adulto $" value={pricesHighGroup.adult} onChange={e => setPricesHighGroup({...pricesHighGroup, adult: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Niño $" value={pricesHighGroup.child} onChange={e => setPricesHighGroup({...pricesHighGroup, child: e.target.value})} style={inputStyle} />
                  <input type="number" placeholder="Bebé $" value={pricesHighGroup.baby} onChange={e => setPricesHighGroup({...pricesHighGroup, baby: e.target.value})} style={inputStyle} />
                </div>
              </div>
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
              <input type="text" placeholder="Navidad / Festivos" value={newSeasonTitle} onChange={e => setNewSeasonTitle(e.target.value)} style={{ ...inputStyle, marginBottom: "0.5rem" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input 
                  type="date" 
                  value={newSeasonStart} 
                  onChange={e => { setNewSeasonStart(e.target.value); setNewSeasonEnd(e.target.value); }} 
                  min={today}
                  max={maxDate}
                  style={inputStyle} 
                />
                <input 
                  type="date" 
                  value={newSeasonEnd} 
                  onChange={e => setNewSeasonEnd(e.target.value)} 
                  min={newSeasonStart || today}
                  max={maxDate}
                  style={inputStyle} 
                />
              </div>
              <button
                onClick={handleAddSeason}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.65rem",
                  background: hasCompleteSeasonDraft ? "#16a34a" : "#e5e7eb",
                  color: hasCompleteSeasonDraft ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: hasCompleteSeasonDraft ? "0 10px 24px rgba(22, 163, 74, 0.24)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                + Agregar
              </button>
            </div>
            <div style={{ maxHeight: "20vh", overflowY: "auto" }}>
              {seasons.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}>
                  <span>{s.title} ({s.start})</span>
                  <button onClick={() => handleRemoveSeason(i)} style={{ color: "red", border: "none", background: "none" }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(4)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={handleContinueFromSeasons} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ padding: "1.5rem", border: "2px dashed #f7c58a", borderRadius: "16px", textAlign: "center", background: "linear-gradient(180deg, #fffaf3 0%, #ffffff 100%)" }}>
              <input type="file" multiple onChange={handleImageChange} style={{ display: "none" }} id="restaurant-images" />
              <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "#fff1dc", color: "#c2410c", fontSize: "0.78rem", fontWeight: "800" }}>
                  {images.length} foto{images.length === 1 ? "" : "s"} cargada{images.length === 1 ? "" : "s"}
                </span>
                <span
                  style={{
                    padding: "0.35rem 0.7rem",
                    borderRadius: "999px",
                    background: "#ecfdf3",
                    color: "#166534",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                    animation: images.length > 0 && canAddMoreImages ? "restaurantImageHintPulse 1.8s ease-in-out infinite" : "none",
                    boxShadow: images.length > 0 && canAddMoreImages ? "0 10px 22px rgba(22, 101, 52, 0.18)" : "none",
                  }}
                >
                  Puedes agregar {remainingImageSlots} más
                </span>
              </div>
              <label
                htmlFor="restaurant-images"
                style={{
                  cursor: canAddMoreImages ? "pointer" : "not-allowed",
                  display: "block",
                  padding: "1.2rem",
                  borderRadius: "14px",
      background: canAddMoreImages ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` : "#e5e7eb",
                  color: "#ffffff",
                  boxShadow: canAddMoreImages ? "0 16px 32px rgba(247, 138, 0, 0.24)" : "none",
                  transition: "all 0.2s ease",
                  opacity: canAddMoreImages ? 1 : 0.7,
                }}
              >
                <span className="material-icons-outlined" style={{ fontSize: "48px", color: "#ffffff" }}>add_a_photo</span>
                <p style={{ margin: "0.6rem 0 0.25rem", fontWeight: "800", fontSize: "1rem" }}>
                  {images.length === 0 ? "Selecciona las primeras fotos" : "Agrega más fotos del restaurante"}
                </p>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.45", opacity: 0.95 }}>
                  {images.length === 0
                    ? "Sube hasta 5 imágenes. La Foto 1 será la portada principal."
                    : canAddMoreImages
                      ? `Ya tienes ${images.length}. Aun puedes sumar ${remainingImageSlots} foto${remainingImageSlots === 1 ? "" : "s"} para mostrar platos, ambiente y detalles del lugar.`
                      : "Ya completaste el máximo de 5 imágenes para este restaurante."}
                </p>
              </label>
              {images.length > 0 ? (
                <p style={{ margin: "0.9rem 0 0", color: "#64748b", fontSize: "0.82rem", textAlign: "center" }}>
                  Sugerencia: combina portada, platos fuertes, bebidas y ambiente para que el producto se vea más completo.
                </p>
              ) : null}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      width: "86px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      background: "#fff",
          border: i === 0 ? `2px solid ${theme.primary}` : "1px solid #e2e8f0",
                      boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <div style={{ width: "100%", height: "72px", overflow: "hidden" }}>
                      <img src={img.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "0.4rem 0.35rem 0.45rem" }}>
                      <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: "800", color: i === 0 ? "#c2410c" : "#475569" }}>
                        {i === 0 ? "Portada" : `Foto ${i + 1}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveImage(i)}
                      style={{
                        position: "absolute",
                        top: "0.25rem",
                        right: "0.25rem",
                        background: "rgba(15,23,42,0.72)",
                        color: "white",
                        border: "none",
                        width: "22px",
                        height: "22px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(5)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={() => setStep(7)} disabled={images.length === 0} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "56px", color: "#2e7d32", marginBottom: "0.5rem" }}>restaurant_menu</span>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>Revisa los detalles generados por la IA y ajusta precios finales en el siguiente paso.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep(6)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={handleFinishWizard} style={{ ...buttonStylePrimary, flex: 2 }}>Ver Borrador y Finalizar</button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes restaurantImageHintPulse {
            0% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-2px) scale(1.04); }
            100% { transform: translateY(0) scale(1); }
          }
          @keyframes restaurantAiSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
