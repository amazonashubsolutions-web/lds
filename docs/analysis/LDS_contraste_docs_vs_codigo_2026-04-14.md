# LDS - Contraste entre documentacion activa y desarrollo real

Fecha: 2026-04-15

## 1. Objetivo

Dejar por escrito el contraste entre:

- la documentacion activa en `docs/`
- la implementacion navegable y visible en `src/`
- la base tecnica real definida en `supabase/migrations/`

Este documento no reemplaza el backlog funcional maestro. Su proposito es identificar:

- que ya esta realmente implementado
- que existe solo de forma parcial
- que aun vive solo en backend o en planeacion
- que partes de la documentacion ya inducen a confusion

## 2. Conclusion ejecutiva

La documentacion de `docs/analysis/` representa bastante bien el estado real del proyecto.

La mayor deuda documental hoy no esta en el diagnostico ni en la matriz ejecutiva. La mayor deuda esta en `docs/planning/LDS_backlog_priorizado.md`, porque mezcla:

- contenido historico valido como referencia
- backlog actualizado a Supabase
- y restos de un modelo anterior basado en grupos por fecha

La conclusion mas importante del contraste es esta:

**LDS ya no debe tratarse como un frontend pendiente de integracion base. Ya existen modulos operativos reales sobre Supabase para panel, productos, catalogo, calendario, cupones de producto, usuarios, agencias y reservas.**

La segunda conclusion importante es esta:

**el backlog oficial sigue siendo util, pero ya no es completamente consistente con el modelo tecnico vigente de cupos por fecha.**

## 3. Hallazgos principales

### 3.1. Lo documentado que si coincide con el codigo real

- autenticacion del panel sobre Supabase
- catalogo publico sobre Supabase
- detalle publico de producto sobre Supabase
- modulo admin de productos sobre Supabase
- calendario operativo navegable
- CRUD de cupones de producto sobre Supabase
- CRUD base de usuarios en panel
- CRUD base de agencias en panel
- modulo de reservas navegable
- solicitudes de ampliacion de cupo
- dashboard ejecutivo aun parcial y todavia apoyado en mocks
- notificaciones de reserva ya operativas sobre Supabase con lectura por usuario
- cierre automatico de sesion del panel a los 30 minutos

### 3.2. Lo implementado que ya va mas adelante que algunos documentos

- ya existe detalle de reserva navegable con datos principales, pasajeros, historial, notas y movimientos de pago
- ya existe flujo de checkout de reserva y trazabilidad de intentos de pago
- el modulo de reservas esta por encima de una simple base inicial
- usuarios y agencias ya tienen vistas, filtros, detalle y edicion modal, no solo listados basicos
- ya existe modelo consolidado de notificaciones por evento de reserva con destinatarios y lecturas por usuario
- la campanita del header ya consume solo notificaciones no leidas y se sincroniza con el panel

### 3.3. Lo que sigue pendiente de forma real

- impresion y envio formal de reservas
- cancelaciones completas y parciales como modulo navegable
- reembolsos como modulo navegable
- reacomodaciones
- cupones de cliente reales sobre backend
- listas de pasajeros como modulo operativo
- check-in como flujo operativo
- alianzas como modulo navegable
- reportes ejecutivos reales
- configuracion del timeout de 30 minutos tambien del lado servidor en Supabase remoto, si se quiere enforcement fuera del frontend

### 3.4. La contradiccion documental mas importante

El modelo vigente segun los documentos recientes es:

- cupo base por activacion
- `capacity_override` por fecha
- `capacity_requests` para ampliacion

Eso si coincide con la migracion vigente que elimina `product_operation_groups` y `operation_group_id`.

Sin embargo, el backlog maestro todavia conserva al menos una seccion que habla de modelar la fecha operativa con uno o varios grupos y cupos. Esa parte debe considerarse desactualizada.

## 4. Matriz de contraste por modulo

| Modulo | Estado real | Evidencia en codigo | Alineacion con docs | Observacion clave |
| --- | --- | --- | --- | --- |
| Acceso al panel | Operativo sobre Supabase | `src/contexts/PanelSessionContext.jsx`, `src/components/auth/PanelAuthGate.jsx` | Alta | La documentacion reciente lo describe bien |
| Catalogo publico | Operativo sobre Supabase | `src/pages/Resultados.jsx`, `src/services/products/publicCatalog.js` | Alta | Ya no debe verse como pendiente de integracion |
| Detalle publico de producto | Operativo sobre Supabase | `src/pages/DetalleProducto.jsx`, `src/services/products/publicCatalog.js` | Alta | Incluye cupones y productos relacionados |
| Productos admin | Operativo sobre Supabase | `src/pages/PanelControlProducts.jsx`, `src/pages/PanelControlProductDetail.jsx`, `src/services/products/adminCatalog.js`, `src/services/products/adminMutations.js` | Alta | El diagnostico reciente lo refleja bien |
| Creacion de producto | Operativa sobre Supabase con soporte de IA | `src/pages/PanelControlProductCreate.jsx`, `src/hooks/useProductCreateForm.js` | Media | En docs aparece mas como backlog que como capacidad ya visible |
| Calendario operativo | Parcial avanzado y navegable | `src/pages/PanelControlProductCalendar.jsx`, `src/services/products/adminCalendar.js` | Alta con una contradiccion puntual | El modulo existe y usa cupos por fecha; el backlog aun conserva lenguaje historico de grupos |
| Cupones de producto | Operativo sobre Supabase | `src/pages/PanelControlCoupons.jsx`, `src/hooks/usePanelCoupons.js`, `src/services/coupons/productCoupons.js` | Alta | Correctamente tratado como modulo real |
| Cupones de cliente | Mock | `src/pages/PanelControlCoupons.jsx`, `src/data/couponsData.js` | Alta | La documentacion reciente tambien los marca como mock |
| Notificaciones de reserva | Operativo sobre Supabase | `src/components/layout/HeaderNotifications.jsx`, `src/components/panel-control/DashboardNotifications.jsx`, `src/services/notifications/notificationsService.js`, `supabase/migrations/20260414233000_notification_event_model.sql` | Media | Esta capacidad quedo mas madura que lo que aun describen varios textos del backlog |
| Usuarios | Operativo base | `src/pages/PanelControlUsers.jsx`, `src/services/users/adminUsers.js` | Alta | Ya incluye crear, editar, ver detalle, foto y alcance por rol |
| Agencias | Operativo base | `src/pages/PanelControlAgencies.jsx`, `src/services/agencies/adminAgencies.js` | Alta | Ya incluye crear, editar y vista detalle, aunque no llega aun al detalle profundo pedido por backlog |
| Reservas listado y creacion | Operativo base ampliado | `src/pages/PanelControlReservations.jsx`, `src/services/reservations/adminReservations.js` | Alta | El modulo esta mas maduro de lo que algunos textos sugieren |
| Detalle de reserva | Operativo base avanzado | `src/pages/PanelControlReservationDetail.jsx`, `src/services/reservations/adminReservations.js` | Media | Algunos docs aun lo presentan como gran pendiente, pero ya existe una base fuerte |
| Checkout y pagos de reserva | Parcial avanzado | `src/pages/PanelControlReservationCreate.jsx`, `src/services/reservations/adminReservations.js`, migraciones de `payment_attempts` | Media | Esta capacidad ya existe tecnicamente y apenas aparece en el relato documental |
| Solicitudes de ampliacion de cupo | Operativo base | `src/pages/PanelControlReservations.jsx`, `src/services/reservations/adminReservations.js`, `capacity_requests` | Alta | Bien alineado con diagnostico y matriz |
| Sesion del panel | Operativo con timeout automatico | `src/contexts/PanelSessionContext.jsx` | Media | Los documentos funcionales no suelen mencionar seguridad de sesion, pero el codigo ya la endurecio |
| Dashboard ejecutivo | Parcial y aun mock | `src/pages/PanelControl.jsx`, `src/data/panelControlData.js` | Alta | La documentacion reciente lo clasifica bien |
| Lista de pasajeros | Pendiente como modulo navegable | sin ruta dedicada en `src/App.jsx`; solo presencia parcial en detalle y flujo de reserva | Alta | Backend y estructuras existen, pero no modulo operativo real |
| Check-in | Pendiente | sin ruta ni pantalla dedicada en `src/` | Alta | Solo hay referencias aisladas, no flujo real |
| Cancelaciones y reembolsos | Pendiente como modulo navegable | sin modulo dedicado en `src/`; base de tablas en `supabase/migrations/` | Alta | Existe soporte de modelo, no experiencia operativa cerrada |
| Alianzas | Pendiente como modulo navegable | sin ruta ni servicios en `src/services/` | Alta | El backend tiene base, el frontend aun no |
| Reportes | Pendiente | sin pantallas ni consultas ejecutivas reales en `src/` | Alta | El dashboard actual no sustituye reporteria |

## 5. Contraste por carpeta documental

### 5.1. `docs/README.md`

Estado: **alineado**

Observaciones:

- identifica correctamente que la fuente funcional oficial es `planning/LDS_backlog_priorizado.md`
- identifica correctamente que `supabase/migrations/` es la fuente oficial del backend real
- diferencia bien `analysis/`, `planning/` y `archive/`

### 5.2. `docs/analysis/LDS_diagnostico_estado_actual.md`

Estado: **mayormente alineado**

Observaciones:

- representa bien el cambio de paradigma hacia Supabase como fuente principal
- acierta al ubicar productos, calendario, cupones, usuarios, agencias y reservas como frentes ya vivos
- acierta al mover el foco hacia postventa, operacion diaria y reporteria

Ajuste recomendado:

- bajar la severidad de la brecha sobre `detalle completo de reserva`, porque ya existe una primera version bastante robusta
- incorporar una nota explicita sobre notificaciones de reserva ya operativas y sesion del panel con timeout

### 5.3. `docs/analysis/LDS_matriz_ejecutiva_modulos.md`

Estado: **alineado con pequenos ajustes**

Observaciones:

- es el documento que mejor resume el estado real por modulo
- clasifica bien `Dashboard ejecutivo` como parcial
- clasifica bien `Lista de pasajeros`, `Check-in`, `Alianzas` y `Reportes` como pendientes

Ajustes recomendados:

- cambiar `Reservas | Base implementada` por un texto ligeramente mas fuerte, por ejemplo `Operativo base avanzado`
- aclarar que `detalle completo` ya tiene una primera implementacion navegable
- agregar fila propia para `Notificaciones de reserva`
- aclarar que `Acceso al panel` ya tiene timeout automatico de 30 minutos

### 5.4. `docs/planning/LDS_plan_integracion_supabase.md`

Estado: **alineado**

Observaciones:

- ya no replantea integraciones base como si estuvieran pendientes
- enfoca correctamente el siguiente trabajo en reservas completas, postventa y operacion diaria

### 5.5. `docs/planning/LDS_validacion_backlog_vs_supabase.md`

Estado: **alineado**

Observaciones:

- es consistente con el estado real del proyecto
- identifica correctamente el giro hacia `capacity_override` y `capacity_requests`

### 5.6. `docs/planning/LDS_modelo_grupos_operativos_y_ocupacion.md`

Estado: **alineado pese al nombre historico**

Observaciones:

- el contenido ya aclara que el nombre es heredado
- el modelo interno descrito si esta alineado al esquema vigente por fecha

### 5.7. `docs/planning/LDS_backlog_priorizado.md`

Estado: **util pero mezclado**

Observaciones:

- sigue siendo util como repositorio funcional amplio
- contiene una parte actualizada a Supabase que si refleja bien el estado del proyecto
- pero conviven secciones historicas con secciones actualizadas
- y todavia conserva lenguaje incompatible con el modelo vigente

Problemas concretos detectados:

- presenta `detalle completo de reserva` y `acciones de impresion y envio` como parte del sprint actualizado de reservas, cuando el detalle ya tiene base navegable y la impresion/envio aun no aparecen en `src/`
- trata notificaciones de reserva solo como backlog del sprint 5, cuando ya existe bandeja operativa, lectura por usuario y RLS real
- conserva una seccion del sprint actualizado de calendario que dice `modelar la fecha operativa como una fecha con uno o varios grupos y cupos`
- esa frase contradice el modelo corregido posterior de `cupo por fecha`

## 6. Contradicciones documentales que conviene corregir

### 6.1. Modelo de calendario

Estado real:

- `product_operation_groups` fue retirado
- `operation_group_id` fue retirado
- el modelo vigente usa `default_capacity`, `capacity_override` y `capacity_requests`

Impacto:

- cualquier texto que siga hablando de grupos por fecha debe marcarse como historico o eliminarse de la fuente oficial

### 6.2. Madurez del modulo de reservas

Estado real:

- ya existe listado
- ya existe creacion
- ya existe detalle
- ya existe historial
- ya existe trazabilidad de pago
- ya existe checkout operativo interno

Impacto:

- reservas no deberia seguir describiendose como modulo apenas naciente
- la brecha real esta mas en estados profundos, cancelaciones, reembolsos y operacion diaria

### 6.3. Uniformidad de integracion a backend

Estado real:

- los modulos operativos principales si consumen Supabase
- el dashboard principal aun usa mocks de `src/data/panelControlData.js`
- cupones de cliente aun son mock

Impacto:

- no todo el proyecto esta en backend real al mismo nivel
- conviene decirlo explicitamente para evitar sobreestimar la madurez del panel completo

### 6.4. Notificaciones y lectura por usuario

Estado real:

- las notificaciones de reserva ya viven en Supabase
- existe modelo consolidado de un evento por reserva con destinatarios y lecturas por usuario
- la campanita solo muestra no leidas
- el panel conserva el historico completo

Impacto:

- ya no corresponde tratar notificaciones como frente sin implementar
- la brecha real es extender este modelo a mas cambios de estado y no solo al vencimiento

## 7. Backlog real sugerido despues del contraste

Orden recomendado:

1. consolidar la maquina de estados de reserva
2. implementar cancelaciones completas y parciales
3. implementar reembolsos y reacomodaciones
4. convertir cupones de cliente en modulo real solo despues de cerrar cancelaciones y reembolsos
5. extender notificaciones a mas eventos de reserva y postventa
6. construir lista de pasajeros
7. construir check-in
8. abrir alianzas
9. abrir reporteria
10. reemplazar indicadores mock del dashboard por metricas reales

## 8. Recomendaciones de mantenimiento documental

### 8.1. Cambios recomendados inmediatos

- mantener `docs/analysis/` como referencia de estado real
- usar este contraste como base para limpiar `docs/planning/LDS_backlog_priorizado.md`
- marcar explicitamente como historicas las secciones del backlog que hablen de grupos por fecha

### 8.2. Ajustes concretos al backlog maestro

- eliminar o reescribir toda referencia activa a `operation_group_id`, `grupo abierto` o `uno o varios grupos por fecha`
- cambiar el lenguaje de `detalle completo de reserva` desde `gran pendiente` a `modulo ya iniciado que requiere maduracion`
- separar con claridad:
  - lo ya implementado
  - lo implementado parcialmente
  - lo solo modelado en backend
  - lo aun no iniciado

### 8.3. Regla editorial recomendada

Cuando un modulo ya tenga:

- ruta navegable en `src/App.jsx`
- servicios reales en `src/services/`
- y soporte estructural vivo en `supabase/migrations/`

no deberia seguir apareciendo en backlog como si fuera un modulo inexistente. Deberia pasar a una de estas categorias:

- operativo
- operativo base
- parcial avanzado
- pendiente de consolidacion

## 9. Resumen final

El contraste confirma que LDS ya tiene una base comercial y administrativa real mucho mas solida de lo que sugiere la lectura superficial del backlog maestro.

La carpeta `docs/analysis/` ya cuenta una historia bastante fiel. La carpeta `docs/planning/`, en cambio, necesita una depuracion editorial para no mezclar:

- alcance historico
- estado real actual
- y decisiones tecnicas ya superadas

La prioridad documental mas importante ahora es alinear por completo el backlog oficial al modelo vigente de:

- Supabase como fuente principal
- cupos por fecha
- reservas con detalle ya iniciado
- y postventa como siguiente gran frente
