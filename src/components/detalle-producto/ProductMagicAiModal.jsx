import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { productCategories, productSubcategories } from "../../data/productsData";

export default function ProductMagicAiModal({ isOpen, onClose, onGenerate, onStartManual, onSwitchToTransport, onSwitchToRestaurant }) {
  const [step, setStep] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const maxDate = oneYearLater.toISOString().split('T')[0];

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [tourName, setTourName] = useState("");
  const [cityName, setCityName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [aiData, setAiData] = useState(null);

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

  if (!isOpen) {
    return null;
  }

  const handleFetchAi = async () => {
    if (!tourName || !cityName || !regionName) return;
    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(async () => {
      try {
        const response = await fetch("/src/data/mockAiResponse.json");
        const data = await response.json();
        setAiData(data);
        setIsGenerating(false);
        setStep(2);
      } catch (error) {
        setIsGenerating(false);
        console.error("Error fetching AI data", error);
      }
    }, 2000);
  };

  const handleAddSeason = () => {
    if (!newSeasonTitle || !newSeasonStart || !newSeasonEnd) return;
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
    const wizardData = {
      selectedSubcategory,
      tourName,
      cityName,
      regionName,
      aiData,
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

  const getStepTitle = () => {
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
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        {[1, 2, 3, 4, 5, 6].map(s => (
          <div key={s} style={{ 
            height: "6px", 
            width: "35px", 
            borderRadius: "3px", 
            backgroundColor: s <= step ? "#F78A00" : "#eee",
            transition: "background-color 0.3s ease"
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: "#F78A00", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>
          Paso {step} de 6
        </p>
        <h2 style={{ margin: 0, color: "#111", fontSize: "1.25rem", fontWeight: "800" }}>
          {getStepTitle()}
        </h2>
      </div>
    </div>
  );

  const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const labelStyle = { display: "block", marginBottom: "0.25rem", fontWeight: "600", fontSize: "0.9rem", color: "#444" };
  const buttonStylePrimary = { width: "100%", padding: "0.85rem", borderRadius: "8px", border: "none", background: "#F78A00", color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" };
  const buttonStyleSecondary = { ...buttonStylePrimary, background: "#0d3b66" };

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
      onClick={onClose}
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

            {selectedCategory === "actividades" ? (
              <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={labelStyle}>Nombre del Paseo</label>
                  <input 
                    type="text" 
                    value={tourName}
                    onChange={e => setTourName(e.target.value)}
                    placeholder="Ej. Rafting en el Cañón" 
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
                      placeholder="Ej. Medellín" 
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Región</label>
                    <input 
                      type="text" 
                      value={regionName}
                      onChange={e => setRegionName(e.target.value)}
                      placeholder="Ej. Antioquia" 
                      style={inputStyle}
                    />
                  </div>
                </div>

                <p style={{ color: "#666", marginBottom: "1rem", fontSize: "0.85rem", lineHeight: "1.4" }}>
                  ✨ Ahorra tiempo generando la estructura inicial de tu paseo en segundos utilizando Inteligencia Artificial.
                </p>

                <button 
                  onClick={handleFetchAi}
                  disabled={!tourName || !cityName || !regionName || isGenerating}
                  style={{ ...buttonStylePrimary, background: isGenerating ? "#ccc" : "#F78A00", cursor: (tourName && cityName && regionName && !isGenerating) ? "pointer" : "not-allowed" }}
                >
                  {isGenerating ? (
                    <>
                      <span className="material-icons-outlined" style={{ animation: "spin 1s linear infinite" }}>sync</span>
                      Generando con IA...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-outlined">auto_awesome</span>
                      Generar Actividad con IA
                    </>
                  )}
                </button>
                <button 
                  onClick={() => onStartManual(selectedCategory, { tourName, cityName, regionName, selectedSubcategory })}
                  style={{ width: "100%", padding: "0.75rem", background: "transparent", border: "none", color: "#888", fontWeight: "600", marginTop: "0.5rem", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}
                >
                  Continuar creación manualmente
                </button>
              </div>
            ) : selectedCategory === "transporte" ? (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <div style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #10b981", borderRadius: "8px", marginBottom: "1rem", color: "#047857" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>directions_car</span>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "0.95rem" }}>
                    Modo exclusivo para Transporte.
                  </p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                    Hemos habilitado un Wizard avanzado para configurar servicios de transporte.
                  </p>
                </div>
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
                <div style={{ padding: "1rem", background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: "8px", marginBottom: "1rem", color: "#92400e" }}>
                  <span className="material-icons-outlined" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>restaurant</span>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "0.95rem" }}>
                    Modo Gastronómico Activado.
                  </p>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                    Habilita el asistente inteligente para configurar menús, horarios y estilo de cocina.
                  </p>
                </div>
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
            ) : selectedCategory !== "" ? (
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

            <button onClick={() => setStep(3)} style={buttonStylePrimary}>Continuar al Paso 3</button>
          </div>
        )}

        {step === 3 && (
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

            <button onClick={() => setStep(4)} style={buttonStylePrimary}>Continuar al Paso 4</button>
            <button onClick={() => setStep(2)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 4 && (
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
                onClick={handleAddSeason}
                disabled={!newSeasonTitle || !newSeasonStart || !newSeasonEnd}
                style={{ width: "100%", padding: "0.5rem", background: "#e2e8f0", border: "none", borderRadius: "6px", fontWeight: "600", cursor: (!newSeasonTitle || !newSeasonStart || !newSeasonEnd) ? "not-allowed" : "pointer", color: "#333"}}
              >
                + Agregar Temporada
              </button>
            </div>

            {seasons.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                {seasons.map((season, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}>
                    <div>
                      <strong>{season.title}</strong>
                      <br/>
                      <span style={{ color: "#666" }}>{season.start} a {season.end}</span>
                    </div>
                    <button onClick={() => handleRemoveSeason(idx)} style={{ background: "transparent", border: "none", color: "#d32f2f", cursor: "pointer" }}>
                      <span className="material-icons-outlined" style={{ fontSize: "1.2rem" }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setStep(5)} style={{...buttonStylePrimary, background: "#0d3b66"}}>Continuar</button>
            <button onClick={() => setStep(3)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 5 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>

            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.8rem" }}>
                Sube de 1 a 5 imágenes relacionadas al producto. <strong>La imagen 1 será la de portada.</strong>
              </p>

              {images.length < 5 && (
                <div style={{ marginBottom: "1rem" }}>
                   <label 
                     style={{
                       display: "inline-block",
                       padding: "0.5rem 1rem",
                       background: "#e2e8f0",
                       borderRadius: "6px",
                       cursor: "pointer",
                       fontSize: "0.85rem",
                       fontWeight: "600",
                       color: "#333",
                       textAlign: "center",
                       width: "100%",
                       boxSizing: "border-box"
                     }}
                   >
                     <span className="material-icons-outlined" style={{ verticalAlign: "middle", marginRight: "5px", fontSize: "1.1rem" }}>add_photo_alternate</span>
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
              )}

              {images.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-start", marginTop: "0.5rem" }}>
                  {images.map((imgObj, idx) => (
                    <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid #F78A00" : "1px solid #ccc" }}>
                      <img src={imgObj.preview} alt={`preview-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button 
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        <span className="material-icons-outlined" style={{ fontSize: "12px" }}>close</span>
                      </button>
                      {idx === 0 && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#F78A00", color: "#fff", fontSize: "10px", textAlign: "center", padding: "2px 0", fontWeight: "bold" }}>
                          PORTADA
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setStep(6)} 
              style={{...buttonStylePrimary, background: "#0d3b66" }}
              disabled={images.length === 0}
            >
              {images.length === 0 ? "Agrega al menos 1 imagen" : "Continuar al Paso 6"}
            </button>
            <button onClick={() => setStep(4)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 6 && (
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

            <button onClick={handleFinishWizard} style={{...buttonStylePrimary, background: "#0d3b66"}}>Entendido, ir a revisar y crear</button>
            <button onClick={() => setStep(5)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
