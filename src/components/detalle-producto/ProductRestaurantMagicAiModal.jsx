import { useState } from "react";
import { createPortal } from "react-dom";

function buildInitialRestaurantWizardState(initialData = {}) {
  return {
    selectedSubcategory: initialData.selectedSubcategory ?? "",
    cityName: initialData.cityName ?? "Leticia",
    tourName: initialData.tourName ?? "",
    regionName: initialData.regionName ?? "",
    foodStyle: "",
    serviceFormat: "",
    departureTime: "",
    returnTime: "",
  };
}

export default function ProductRestaurantMagicAiModal({
  isOpen,
  onClose,
  onGenerate,
  initialData,
}) {
  const initialWizardState = buildInitialRestaurantWizardState(initialData);
  const [step, setStep] = useState(1);
  const selectedCategory = "restaurantes";
  
  // Step 1 State (Pre-IA Restaurant Details)
  const [selectedSubcategory] = useState(() => initialWizardState.selectedSubcategory);
  const [cityName, setCityName] = useState(() => initialWizardState.cityName);
  const [tourName] = useState(() => initialWizardState.tourName);
  const [regionName] = useState(() => initialWizardState.regionName);
  const [foodStyle, setFoodStyle] = useState(() => initialWizardState.foodStyle);
  const [serviceFormat, setServiceFormat] = useState(
    () => initialWizardState.serviceFormat,
  );
  const [departureTime, setDepartureTime] = useState(
    () => initialWizardState.departureTime,
  );
  const [returnTime, setReturnTime] = useState(() => initialWizardState.returnTime);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiData, setAiData] = useState(null);

  // Step 3 State (Images)
  const [images, setImages] = useState([]);

  if (!isOpen) {
    return null;
  }

  const handleFetchAi = async () => {
    if (!cityName || !foodStyle || !serviceFormat || !departureTime || !returnTime || !selectedSubcategory) return;
    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(async () => {
      try {
        const response = await fetch("/src/data/mockAiResponseRestaurante.json");
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
      isRestaurant: true,
      selectedSubcategory,
      tourName,
      cityName,
      regionName,
      foodStyle,
      serviceFormat,
      openingTime: departureTime,
      closingTime: returnTime,
      aiData,
      images
    };
    onGenerate(selectedCategory, wizardData);
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Información del Restaurante";
      case 2: return "Resultados de la IA";
      case 3: return "Galería de Imágenes";
      case 4: return "Resumen Final";
      default: return "";
    }
  };

  const renderStepIndicator = () => (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ 
            height: "6px", 
            width: "35px", 
            borderRadius: "3px", 
            backgroundColor: s <= step ? "#eab308" : "#eee",
            transition: "background-color 0.3s ease"
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: "#eab308", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>
          Paso {step} de 4
        </p>
        <h2 style={{ margin: 0, color: "#111", fontSize: "1.25rem", fontWeight: "800" }}>
          {getStepTitle()}
        </h2>
      </div>
    </div>
  );

  const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const labelStyle = { display: "block", marginBottom: "0.25rem", fontWeight: "600", fontSize: "0.9rem", color: "#444" };
  const buttonStylePrimary = { width: "100%", padding: "0.85rem", borderRadius: "8px", border: "none", background: "#eab308", color: "#fff", fontWeight: "700", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" };

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

        {step === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "36px", color: "#eab308", marginBottom: "0.5rem" }}>
                restaurant
              </span>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>Configura los datos del servicio de alimentación.</p>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Ciudad</label>
              <input 
                type="text" 
                value={cityName}
                onChange={e => setCityName(e.target.value)}
                placeholder="Ej. Leticia" 
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
               <div>
                  <label style={labelStyle}>Estilo de Comida</label>
                  <select value={foodStyle} onChange={(e) => setFoodStyle(e.target.value)} style={inputStyle}>
                    <option value="" disabled>Elegir estilo...</option>
                    <option value="Brasileña">Brasileña</option>
                    <option value="Colombiana">Colombiana</option>
                    <option value="Amazónica">Amazónica</option>
                    <option value="Tres Fronteras">Tres Fronteras</option>
                    <option value="Internacional">Internacional</option>
                  </select>
               </div>
               <div>
                  <label style={labelStyle}>Formato de Servicio</label>
                  <select value={serviceFormat} onChange={(e) => setServiceFormat(e.target.value)} style={inputStyle}>
                    <option value="" disabled>Elegir formato...</option>
                    <option value="Buffet">Buffet</option>
                    <option value="A la carta">A la carta</option>
                  </select>
               </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Horario Apertura</label>
                <input 
                  type="time" 
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Horario Cierre</label>
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
              disabled={!cityName || !foodStyle || !serviceFormat || !departureTime || !returnTime || isGenerating}
              style={{ ...buttonStylePrimary, background: isGenerating ? "#ccc" : "#eab308", cursor: isGenerating ? "not-allowed" : "pointer" }}
            >
              {isGenerating ? (
                <>
                  <span className="material-icons-outlined" style={{ animation: "spin 1s linear infinite" }}>sync</span>
                  Gastronomerizando...
                </>
              ) : (
                <>
                  <span className="material-icons-outlined">auto_awesome</span>
                  Generar Menú con IA
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ padding: "1rem", background: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", marginBottom: "1.5rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", color: "#ca8a04", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span className="material-icons-outlined" style={{ fontSize: "1.2rem" }}>check_circle</span>
                Estructura culinaria creada
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#a16207", lineHeight: "1.5" }}>
                Basados en un formato <strong>{serviceFormat}</strong> de estilo <strong>{foodStyle}</strong> abierto desde {departureTime} hasta {returnTime}, la IA ha mapeado los platillos, consideraciones y estructura. Los precios y matriz de edades los podrás definir manualmente desde el panel final de control.
              </p>
            </div>
            
            <button onClick={() => setStep(3)} style={buttonStylePrimary}>Continuar a Imágenes</button>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1rem" }}>
                Sube las mejores tomas de los platos y del lugar. La imagen 1 será la portada.
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
                    <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid #eab308" : "1px solid #ccc" }}>
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

            <button onClick={() => setStep(4)} disabled={images.length === 0} style={{ ...buttonStylePrimary, opacity: images.length ? 1 : 0.5 }}>
              Continuar al Resumen
            </button>
            <button onClick={() => setStep(2)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "center" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "56px", color: "#eab308", marginBottom: "0.5rem" }}>
                restaurant_menu
              </span>
            </div>
            <div style={{ padding: "1.5rem", background: "#fef9c3", border: "2px dashed #eab308", borderRadius: "12px", marginBottom: "1.5rem" }}>
              <p style={{ color: "#a16207", fontSize: "0.95rem", lineHeight: "1.5", margin: "0" }}>
                El restaurante será persistido en el borrador con toda la IA aplicada. La matriz de edades, tarifas y consideraciones las fijaremos en el control base.
              </p>
            </div>
            <button onClick={handleFinishWizard} style={{...buttonStylePrimary, background: "#854d0e"}}>
              Ver y Guardar Restaurante
            </button>
            <button onClick={() => setStep(3)} style={{...buttonStylePrimary, background: "transparent", color: "#888", border: "1px solid #ddd", marginTop: "0.5rem"}}>Volver</button>
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
