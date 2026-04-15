# LDS - Informe Actualizado del Analisis

Fecha: 2026-04-15

## Objetivo

Dejar un informe corto y actualizado que contraste la documentacion activa de `docs/` con el estado real del proyecto despues de los ultimos avances sobre:

- notificaciones de reserva
- lectura por usuario
- RLS en Supabase
- sincronizacion entre campanita y panel
- cierre automatico de sesion del panel

## Resumen ejecutivo

El proyecto ya tiene cerrados varios frentes que en la documentacion vieja aun podian leerse como pendientes o parciales:

- notificaciones de reserva operativas sobre Supabase
- modelo de una notificacion por evento con destinatarios y lecturas por usuario
- campanita del header conectada a datos reales
- panel de notificaciones conectado a datos reales
- cierre automatico de sesion del panel a los 30 minutos

La brecha principal ya no esta en crear estos frentes, sino en extenderlos a mas eventos de negocio y endurecer algunos puntos operativos.

## Verificacion de lo ya hecho

### Hecho

- `Acceso al panel`:
  ya existe autenticacion real con Supabase y ahora el panel expira la sesion a los 30 minutos en `src/contexts/PanelSessionContext.jsx`.

- `Notificaciones de reserva`:
  ya existe bandeja operativa en header y panel con `fetchMyNotifications()` y `markNotificationAsReadInSupabase()` en `src/services/notifications/notificationsService.js`.

- `Lectura por usuario`:
  ya existe persistencia de lectura en `public.notification_reads` y destinatarios en `public.notification_recipients` segun `supabase/migrations/20260414233000_notification_event_model.sql`.

- `RLS de notificaciones`:
  ya existe control de acceso por destinatario real con `public.can_access_notification(...)`.

- `Campanita del header`:
  ya consume solo notificaciones no leidas y las saca de la lista cuando se leen en `src/components/layout/HeaderNotifications.jsx`.

- `Panel de notificaciones`:
  ya conserva el historico completo y sincroniza el estado de lectura con la campanita en `src/components/panel-control/DashboardNotifications.jsx`.

- `Consolidacion de duplicados`:
  las notificaciones de una misma reserva ya no viven como filas duplicadas por destinatario; ahora existe un solo evento con multiples destinatarios.

## Lo que sigue faltando

### Pendiente real

- extender notificaciones a mas cambios de estado:
  `emitida`, `cancelada por usuario`, `en reembolso`, `no show` y eventos de postventa.

- definir si algunas notificaciones tambien deben salir por email:
  hoy la base operativa en app ya existe, pero no esta cerrada la estrategia de correo.

- consolidar la maquina de estados de reserva:
  sigue siendo el siguiente frente fuerte del proyecto.

- cerrar cancelaciones, reembolsos y reacomodaciones como modulo operativo:
  el backend tiene base, pero el modulo de negocio aun no esta completo.

- decidir si el timeout de 30 minutos tambien debe ser forzado del lado servidor:
  hoy ya se cumple en la app; falta definir si tambien se configura en Supabase Auth remoto.

## Documentos revisados y ajuste recomendado

- `docs/analysis/LDS_diagnostico_estado_actual.md`
  debe tratar notificaciones y sesion como capacidades ya operativas.

- `docs/analysis/LDS_matriz_ejecutiva_modulos.md`
  debe listar `Notificaciones de reserva` como modulo operativo y `Acceso al panel` como operativo con timeout automatico.

- `docs/analysis/LDS_contraste_docs_vs_codigo_2026-04-14.md`
  debe reconocer que notificaciones y sesion ya avanzaron mas que lo que sugerian versiones anteriores.

- `docs/planning/LDS_validacion_backlog_vs_supabase.md`
  debe mover notificaciones desde "frente por crear" hacia "frente ya resuelto en base y pendiente de expansion".

## Conclusiones

La documentacion de analisis sigue siendo util, pero ya necesitaba una actualizacion puntual. Despues de contrastar `docs/`, `src/` y `supabase/migrations/`, el estado real actualizado es este:

- el proyecto ya tiene base operativa fuerte sobre Supabase
- notificaciones ya no son un experimento ni un mock
- la seguridad de sesion del panel ya subio de nivel
- el foco pendiente vuelve a estar en reservas profundas, postventa y reporteria
