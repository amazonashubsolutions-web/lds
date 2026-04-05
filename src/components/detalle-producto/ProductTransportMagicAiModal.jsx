import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { productCategories, productSubcategories } from "../../data/productsData";

export default function ProductTransportMagicAiModal({ isOpen, onClose, onGenerate, initialData }) {
  const [step, setStep] = useState(2);
  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const maxDate = oneYearLater.toISOString().split('T')[0];
  
  const selectedCategory = "transporte";
  
  // Step 1 State (Pre-IA Transport Details)
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [cityName, setCityName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.selectedSubcategory) setSelectedSubcategory(initialData.selectedSubcategory);
      if (initialData.cityName) setCityName(initialData.cityName);
    }
  }, [isOpen, initialData]);

  // Step 3 State (Flat Pricing)
  const [priceLow, setPriceLow] = useState("");
  const [priceHigh, setPriceHigh] = useState("");

  // Step 4 State (Seasons)
  const [seasons, setSeasons] = useState([]);
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
    if (!cityName || !vehicleType || !capacity || !departureTime || !returnTime) return;
    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(async () => {
      try {
        const response = await fetch("/src/data/mockAiResponseTransporte.json");
        const data = await response.json();
        setAiData(data);
        setIsGenerating(false);
        setStep(3);
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
      isTransport: true,
      selectedSubcategory,
      cityName,
      vehicleType,
      capacity,
      departureTime,
      returnTime,
      aiData,
      priceLow,
      priceHigh,
      seasons,
      images
    };
    onGenerate(selectedCategory, wizardData);
  };

  const getStepTitle = () => {
    switch(step) {
      case 2: return "Información del Transporte";
      case 3: return "Configuración de Precios";
      case 4: return "Fechas Especiales";
      case 5: return "Galería de Imágenes";
      case 6: return "Resumen y Finalización";
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
            backgroundColor: s <= step ? "#10b981" : "#eee",
            transition: "background-color 0.3s ease"
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: "#10b981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>
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
  const buttonStylePrimary = { width: "100%", padding: "0.85rem", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" };

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
          maxWidth: "550px",
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          fontFamily: "inherit",
          textAlign: "center"
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
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
            padding: "0.2rem",
          }}
        >
          <span className="material-icons-outlined" style={{ fontSize: "1.5rem" }}>close</span>
        </button>

        {renderStepIndicator()}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "36px", color: "#10b981", marginBottom: "0.5rem" }}>
                directions_car
              </span>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>Configura los datos del vehículo y horarios.</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Tipo de Vehículo</label>
                <input 
                  type="text" 
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  placeholder="Ej. Van Privada" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Capacidad (pax)</label>
                <input 
                  type="number" 
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  placeholder="Ej. 10" 
                  style={inputStyle}
                  min={1}
                />
              </div>
              <div>
                <label style={labelStyle}>Hora Franja (Inicio)</label>
                <input 
                  type="time" 
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Hora Franja (Fin)</label>
                <input 
                  type="time" 
                  value={returnTime}
                  onChange={e => setReturnTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button 
              onClick={handleFetchAi}
              disabled={!cityName || !vehicleType || !capacity || !departureTime || !returnTime || isGenerating}
              style={{ ...buttonStylePrimary, background: isGenerating ? "#ccc" : "#10b981", cursor: isGenerating ? "not-allowed" : "pointer" }}
            >
              {isGenerating ? (
                <>
                  <span className="material-icons-outlined" style={{ animation: "spin 1s linear infinite" }}>sync</span>
                  Procesando Rutas...
                </>
              ) : (
                <>
                  <span className="material-icons-outlined">auto_awesome</span>
                  Generar Servicio con IA
                </>
              )}
            </button>
            <button 
              onClick={onClose} 
              style={{ ...buttonStylePrimary, background: "transparent", border: "1px solid #ddd", color: "#666", marginTop: "0.75rem" }}
            >
              Volver
            </button>
          </div>
        )}


        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Para el transporte, define un precio global para toda la reserva del vehículo, independiente de cuántas personas lo ocupen (hasta la capacidad máxima de {capacity} pasjeros).
            </p>

            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }}>
              <h4 style={{ margin: "0 0 0.8rem 0", color: "#333", fontSize: "0.95rem" }}>Tarifa Base / Temporada Baja</h4>
              <div style={{ position: "relative" }}>
                 <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#666" }}>$</span>
                 <input 
                   type="number" 
                   value={priceLow} 
                   onChange={e => setPriceLow(e.target.value)} 
                   placeholder="Ej. 150000" 
                   style={{...inputStyle, paddingLeft: "1.8rem"}} 
                 />
              </div>
            </div>

            <div style={{ background: "#fff5e6", padding: "1rem", borderRadius: "8px", border: "1px solid #fbd38d", marginBottom: "1.5rem" }}>
              <h4 style={{ margin: "0 0 0.8rem 0", color: "#9c4221", fontSize: "0.95rem" }}>Tarifa Temporada Alta</h4>
              <div style={{ position: "relative" }}>
                 <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#666" }}>$</span>
                 <input 
                   type="number" 
                   value={priceHigh} 
                   onChange={e => setPriceHigh(e.target.value)} 
                   placeholder="Ej. 200000" 
                   style={{...inputStyle, paddingLeft: "1.8rem"}} 
                 />
              </div>
            </div>

            <button onClick={() => setStep(4)} disabled={!priceLow} style={{ ...buttonStylePrimary, opacity: priceLow ? 1 : 0.5 }}>Continuar a Fechas</button>
            <button onClick={() => setStep(2)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{...labelStyle, fontSize: "0.8rem"}}>Título (Ej: Nacionales)</label>
                <input type="text" value={newSeasonTitle} onChange={e => setNewSeasonTitle(e.target.value)} style={{...inputStyle, padding: "0.5rem"}} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.8rem" }}>
                <div>
                  <label style={{...labelStyle, fontSize: "0.8rem"}}>Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={newSeasonStart} 
                    onChange={e => { setNewSeasonStart(e.target.value); setNewSeasonEnd(e.target.value); }} 
                    min={today}
                    max={maxDate}
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
                style={{ width: "100%", padding: "0.5rem", background: "#e2e8f0", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", color: "#333"}}
              >
                + Agregar Temporada
              </button>
            </div>

            {seasons.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                {seasons.map((season, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderBottom: "1px solid #eee", fontSize: "0.85rem" }}>
                    <div>
                      <strong>{season.title}</strong><br/>
                      <span style={{ color: "#666" }}>{season.start} a {season.end}</span>
                    </div>
                    <button onClick={() => handleRemoveSeason(idx)} style={{ background: "transparent", border: "none", color: "#d32f2f", cursor: "pointer" }}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setStep(5)} style={buttonStylePrimary}>Continuar a Imágenes</button>
            <button onClick={() => setStep(3)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 5 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1rem" }}>
                Sube las mejores tomas del exterior e interior. La imagen 1 será la principal.
              </p>
              {images.length < 5 && (
                <label style={{ display: "inline-block", padding: "0.75rem", background: "#e2e8f0", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", width: "100%", boxSizing: "border-box" }}>
                   Seleccionar Fotos
                   <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              )}

              {images.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1rem" }}>
                  {images.map((imgObj, idx) => (
                    <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid #10b981" : "1px solid #ccc" }}>
                      <img src={imgObj.preview} alt={`prev-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button 
                        onClick={() => handleRemoveImage(idx)}
                        style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer", width: "20px", height: "20px" }}
                      >x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setStep(6)} disabled={images.length === 0} style={{ ...buttonStylePrimary, opacity: images.length ? 1 : 0.5 }}>
              Continuar al Resumen
            </button>
            <button onClick={() => setStep(4)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 6 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "center" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "56px", color: "#059669", marginBottom: "0.5rem" }}>
                directions_car
              </span>
            </div>
            <div style={{ padding: "1.5rem", background: "#f0fdf4", border: "2px dashed #10b981", borderRadius: "12px", marginBottom: "1.5rem" }}>
              <p style={{ color: "#047857", fontSize: "0.95rem", lineHeight: "1.5", margin: "0" }}>
                Llevaremos todos tus datos y la generación de IA al formulario de control. Revisa todo antes de persistir tu nuevo servicio.
              </p>
            </div>
            <button onClick={handleFinishWizard} style={{...buttonStylePrimary, background: "#064e3b"}}>
              Revisar y Guardar Vehículo
            </button>
            <button onClick={() => setStep(5)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}
      </div>
      <style>{`
         @keyframes spin { 100% { transform: rotate(360deg); } }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>,
    document.body
  );
}
