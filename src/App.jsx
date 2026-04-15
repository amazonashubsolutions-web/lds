import { Navigate, Route, Routes } from "react-router-dom";

import PanelAuthGate from "./components/auth/PanelAuthGate";
import ScrollToTop from "./components/layout/ScrollToTop";
import BuscadorPage from "./pages/Buscador";
import DetalleProductoPage from "./pages/DetalleProducto";
import DestinoPage from "./pages/Destino";
import PanelControlPage from "./pages/PanelControl";
import PanelControlCouponsPage from "./pages/PanelControlCoupons";
import PanelControlAgenciesPage from "./pages/PanelControlAgencies";
import PanelControlProductCreatePage from "./pages/PanelControlProductCreate";
import PanelControlProductCalendarPage from "./pages/PanelControlProductCalendar";
import PanelControlProductDetailPage from "./pages/PanelControlProductDetail";
import PanelControlProductsPage from "./pages/PanelControlProducts";
import PanelControlReservationCreatePage from "./pages/PanelControlReservationCreate";
import PanelControlReservationDetailPage from "./pages/PanelControlReservationDetail";
import PanelControlReservationsPage from "./pages/PanelControlReservations";
import PanelControlUsersPage from "./pages/PanelControlUsers";
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
        <Route element={<PanelAuthGate />}>
          <Route path="/panel-de-control" element={<PanelControlPage />} />
          <Route path="/panel-de-control/cupones" element={<PanelControlCouponsPage />} />
          <Route path="/panel-de-control/agencias" element={<PanelControlAgenciesPage />} />
          <Route path="/panel-de-control/usuarios" element={<PanelControlUsersPage />} />
          <Route path="/panel-de-control/reservas" element={<PanelControlReservationsPage />} />
          <Route
            path="/panel-de-control/reservas/nueva"
            element={<PanelControlReservationCreatePage />}
          />
          <Route
            path="/panel-de-control/reservas/:reservationId"
            element={<PanelControlReservationDetailPage />}
          />
          <Route path="/panel-de-control/productos" element={<PanelControlProductsPage />} />
          <Route
            path="/panel-de-control/productos/nuevo"
            element={<PanelControlProductCreatePage />}
          />
          <Route
            path="/panel-de-control/productos/:productId"
            element={<PanelControlProductDetailPage />}
          />
          <Route
            path="/panel-de-control/productos/:productId/calendario"
            element={<PanelControlProductCalendarPage />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/buscador" replace />} />
      </Routes>
    </>
  );
}

export default App;
