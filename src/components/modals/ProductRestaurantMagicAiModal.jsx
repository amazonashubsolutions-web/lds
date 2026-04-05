import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { productCategories, productSubcategories } from "../../data/productsData";

export default function ProductRestaurantMagicAiModal({ isOpen, onClose, onGenerate, onStartManual, initialData }) {
  const [step, setStep] = useState(2);
  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const maxDate = oneYearLater.toISOString().split('T')[0];

  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [cityName, setCityName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.selectedSubcategory) setSelectedSubcategory(initialData.selectedSubcategory);
      if (initialData.tourName) setRestaurantName(initialData.tourName);
      if (initialData.cityName) setCityName(initialData.cityName);
      if (initialData.regionName) setRegionName(initialData.regionName);
    }
  }, [isOpen, initialData]);

  // Foodie Specifics (Step 2)
  const [foodStyle, setFoodStyle] = useState(""); 
  const [serviceFormat, setServiceFormat] = useState(""); 
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");

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

  if (!isOpen) return null;

  const handleFetchAi = async () => {
    if (!restaurantName || !cityName || !regionName || !serviceFormat || !foodStyle) return;
    setIsGenerating(true);
    
    // Simulate AI generation with collected variables
    setTimeout(async () => {
      try {
        const response = await fetch("/src/data/mockAiRestaurantResponse.json");
        const data = await response.json();
        setAiData(data);
        setIsGenerating(false);
        setStep(3); // Move to prices after AI generation
      } catch (error) {
        setIsGenerating(false);
        console.error("Error fetching Restaurant AI data", error);
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
      selectedSubcategory,
      tourName: restaurantName, 
      cityName,
      regionName,
      aiData,
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

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Información del Restaurante";
      case 2: return "Estilo y Horarios";
      case 3: return "Precios del Menú";
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
  const buttonStyleSecondary = { width: "100%", padding: "0.85rem", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: "700", fontSize: "1rem", cursor: "pointer" };

  return createPortal(
    <div
      className="product-magic-ai-backdrop"
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="product-magic-ai-modal"
        style={{
          position: "relative", background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "1.5rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", textAlign: "center"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: "1.2rem", right: "1.2rem", background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>
          <span className="material-icons-outlined">close</span>
        </button>

        {renderStepIndicator()}


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
              <button onClick={onClose} style={buttonStyleSecondary}>Volver</button>
              <button 
                onClick={handleFetchAi} 
                disabled={!foodStyle || !serviceFormat || isGenerating} 
                style={{ ...buttonStylePrimary, flex: 2 }}
              >
                {isGenerating ? "Generando con IA..." : "Generar con IA ✨"}
              </button>
            </div>
            
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
              <button onClick={() => setStep(2)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={() => setStep(4)} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 4 && (
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
              <button onClick={handleAddSeason} style={{ width: "100%", marginTop: "0.5rem", padding: "0.4rem", background: "#eee", border: "none", borderRadius: "4px" }}>+ Agregar</button>
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
              <button onClick={() => setStep(3)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={() => setStep(5)} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ animation: "fadeIn 0.3s ease", textAlign: "left" }}>
            <div style={{ padding: "1.5rem", border: "2px dashed #ddd", borderRadius: "12px", textAlign: "center" }}>
              <input type="file" multiple onChange={handleImageChange} style={{ display: "none" }} id="restaurant-images" />
              <label htmlFor="restaurant-images" style={{ cursor: "pointer" }}>
                <span className="material-icons-outlined" style={{ fontSize: "48px", color: "#F78A00" }}>add_a_photo</span>
                <p style={{ margin: "0.5rem 0 0", color: "#666" }}>Sube hasta 5 fotos (Portada = Foto 1)</p>
              </label>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <div key={i} style={{ width: "60px", height: "60px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                    <img src={img.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => handleRemoveImage(i)} style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "white", border: "none", fontSize: "10px" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setStep(4)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={() => setStep(6)} disabled={images.length === 0} style={{ ...buttonStylePrimary, flex: 2 }}>Continuar</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span className="material-icons-outlined" style={{ fontSize: "56px", color: "#2e7d32", marginBottom: "0.5rem" }}>restaurant_menu</span>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>Revisa los detalles generados por la IA y ajusta precios finales en el siguiente paso.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep(5)} style={buttonStyleSecondary}>Volver</button>
              <button onClick={handleFinishWizard} style={{ ...buttonStylePrimary, flex: 2 }}>Ver Borrador y Finalizar</button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
