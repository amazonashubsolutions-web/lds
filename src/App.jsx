import { Navigate, Route, Routes } from "react-router-dom";

import ScrollToTop from "./components/layout/ScrollToTop";
import BuscadorPage from "./pages/Buscador";
import DetalleProductoPage from "./pages/DetalleProducto";
import PanelControlPage from "./pages/PanelControl";
import ResultadosPage from "./pages/Resultados";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/buscador" replace />} />
        <Route path="/buscador" element={<BuscadorPage />} />
        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/detalle-producto/:productId" element={<DetalleProductoPage />} />
        <Route path="/panel-de-control" element={<PanelControlPage />} />
        <Route path="*" element={<Navigate to="/buscador" replace />} />
      </Routes>
    </>
  );
}

export default App;
