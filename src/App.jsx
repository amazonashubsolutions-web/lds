import { Navigate, Route, Routes } from "react-router-dom";

import ScrollToTop from "./components/layout/ScrollToTop";
import BuscadorPage from "./pages/Buscador";
import DetalleProductoPage from "./pages/DetalleProducto";
import DestinoPage from "./pages/Destino";
import PanelControlPage from "./pages/PanelControl";
import PanelControlCouponsPage from "./pages/PanelControlCoupons";
import PanelControlProductCreatePage from "./pages/PanelControlProductCreate";
import PanelControlProductDetailPage from "./pages/PanelControlProductDetail";
import PanelControlProductsPage from "./pages/PanelControlProducts";
import ResultadosPage from "./pages/Resultados";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/buscador" replace />} />
        <Route path="/buscador" element={<BuscadorPage />} />
        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/destino" element={<DestinoPage />} />
        <Route path="/detalle-producto/:productId" element={<DetalleProductoPage />} />
        <Route path="/panel-de-control" element={<PanelControlPage />} />
        <Route path="/panel-de-control/cupones" element={<PanelControlCouponsPage />} />
        <Route path="/panel-de-control/productos" element={<PanelControlProductsPage />} />
        <Route
          path="/panel-de-control/productos/nuevo"
          element={<PanelControlProductCreatePage />}
        />
        <Route
          path="/panel-de-control/productos/:productId"
          element={<PanelControlProductDetailPage />}
        />
        <Route path="*" element={<Navigate to="/buscador" replace />} />
      </Routes>
    </>
  );
}

export default App;
