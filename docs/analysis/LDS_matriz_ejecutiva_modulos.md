# LDS - Matriz Ejecutiva de Modulos

Fecha: 2026-04-15

## Objetivo

Resumir el estado real de LDS por modulo segun el codigo actual, las migraciones vigentes y la experiencia ya validada en panel y frontend publico.

## Matriz

| Modulo | Estado | Evidencia | Siguiente paso |
| --- | --- | --- | --- |
| Productos | Operativo sobre Supabase | `src/pages/PanelControlProducts.jsx`, `src/pages/PanelControlProductDetail.jsx`, `src/services/products/adminCatalog.js`, `src/services/products/adminMutations.js` | Mantener permisos por rol y conectar mas fuerte con reservas y postventa |
| Catalogo publico | Operativo sobre Supabase | `src/pages/Resultados.jsx`, `src/pages/DetalleProducto.jsx`, `src/services/products/publicCatalog.js` | Afinar UX publica y preparar puntos de entrada para reservas |
| Calendario operativo | Parcial avanzado | `src/pages/PanelControlProductCalendar.jsx`, `src/services/products/adminCalendar.js` | Consolidar flujo critico de reactivacion y lectura de disponibilidad por fecha |
| Cupones de producto | Operativo sobre Supabase | `src/pages/PanelControlCoupons.jsx`, `src/services/coupons/productCoupons.js` | Integrarlo despues con reservas cuando aplique |
| Cupones de cliente | Mock / parcial | `src/data/couponsData.js`, panel de cupones | Mantenerlo fuera de backend hasta cerrar cancelaciones y reembolsos |
| Acceso al panel | Operativo con timeout automatico | `src/components/auth/PanelAuthGate.jsx`, `src/contexts/PanelSessionContext.jsx` | Decidir si el timeout de 30 minutos tambien se forza en Supabase remoto |
| Notificaciones de reserva | Operativo sobre Supabase | `src/components/layout/HeaderNotifications.jsx`, `src/components/panel-control/DashboardNotifications.jsx`, `src/services/notifications/notificationsService.js`, `supabase/migrations/20260414233000_notification_event_model.sql` | Extender la misma base a otros eventos de reserva ademas del vencimiento |
| Usuarios | Operativo base | `src/pages/PanelControlUsers.jsx`, `src/services/users/adminUsers.js` | Ampliar detalle, activacion y administracion fina |
| Agencias | Operativo base | `src/pages/PanelControlAgencies.jsx`, `src/services/agencies/adminAgencies.js` | Completar vista detalle y relacion con usuarios asociados |
| Reservas | Operativo base avanzado | `src/pages/PanelControlReservations.jsx`, `src/services/reservations/adminReservations.js` | Construir detalle completo, estados y acciones operativas faltantes |
| Solicitudes de ampliacion de cupo | Base implementada | `capacity_requests`, `src/services/reservations/adminReservations.js` | Integrar notificaciones y seguimiento visual desde calendario |
| Estado operativo de producto | Parcial avanzado | detalle de producto, calendario, casos de inhabilitacion | Consolidar la logica de casos criticos y reactivacion por `super_user` |
| Dashboard ejecutivo | Parcial | `src/pages/PanelControl.jsx` y vistas del panel | Reemplazar indicadores mock por metricas reales cuando reservas y postventa maduren |
| Lista de pasajeros | Pendiente | sin modulo navegable real | Construir sobre reservas y calendario ya existentes |
| Check-in | Pendiente | sin flujo operativo real | Implementar despues de lista de pasajeros |
| Cancelaciones y reembolsos | Pendiente | casos parciales ya modelados, sin modulo completo | Construir siguiente gran frente funcional |
| Alianzas | Pendiente | sin modulo real navegable | Implementar cuando reservas y estados ya esten mas cerrados |
| Reportes | Pendiente | sin consultas y pantallas ejecutivas reales | Construir sobre trazabilidad completa de reservas y postventa |

## Resumen ejecutivo

### Modulos que ya no deben tratarse como "pendientes de integracion base"

- productos
- catalogo
- detalle de producto
- acceso al panel
- notificaciones de reserva
- usuarios
- agencias
- cupones de producto

### Modulos que ya existen pero siguen en consolidacion

- calendario operativo
- reservas
- notificaciones de reserva
- dashboard ejecutivo
- estado operativo del producto

### Modulos que siguen como siguiente gran frente

- detalle de reserva
- estados y trazabilidad de reserva
- cancelaciones
- reembolsos
- extension de notificaciones a mas eventos que vencimiento
- listas de pasajeros
- check-in
- alianzas
- reporteria

## Nota importante

La matriz ya no usa el modelo de `grupos operativos por fecha`. El modelo vigente para disponibilidad es:

- `cupo base por activacion`
- `capacity_override` por fecha cuando aplique
- `capacity_requests` para solicitar ampliacion
