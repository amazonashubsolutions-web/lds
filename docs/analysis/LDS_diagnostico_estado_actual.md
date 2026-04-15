# LDS - Diagnostico de Estado Actual del Proyecto

Fecha: 2026-04-15

## 1. Objetivo

Este documento actualiza el estado real de LDS despues de contrastar:

- el backlog oficial en `docs/planning/LDS_backlog_priorizado.md`
- la estructura actual de `src/`
- las migraciones y RLS vivas en `supabase/`
- los avances recientes ya implementados en frontend y validados sobre Supabase

La conclusion principal ya no es "integrar productos a Supabase". La conclusion correcta hoy es esta:

**LDS ya tiene una base comercial y administrativa real sobre Supabase. El siguiente trabajo no es rehacer integraciones base, sino cerrar operacion de reservas, postventa y modulos diarios.**

## 2. Resumen ejecutivo

Hoy LDS ya opera sobre Supabase en estos frentes:

- autenticacion del panel
- cierre automatico de sesion del panel a los 30 minutos
- roles y perfil del usuario
- catalogo publico
- detalle publico de producto
- panel de productos con permisos por rol
- detalle administrativo de producto
- calendario operativo base
- cupones de producto
- agencias y usuarios en panel
- reservas base y solicitudes de ampliacion de cupo
- notificaciones de reserva persistidas en Supabase

Esto significa que la app ya no esta en fase `frontend-only` para sus frentes principales.

## 3. Aclaracion importante sobre el modelo vigente

Se hizo una correccion funcional importante:

- **ya no usamos el modelo de grupos por fecha**
- el modelo vigente ahora es **cupos por fecha**
- el cupo base se define al habilitar un rango activo
- una fecha puede tener `capacity_override`
- la ocupacion del calendario se calcula por:
  - pasajeros activos reservados en la fecha
  - capacidad efectiva de esa fecha

Adicionalmente:

- si una agencia vendedora necesita mas cupos, no crea reserva ni crea grupos
- LDS registra una `capacity_request`
- la ampliacion la gestiona la agencia proveedora duena del producto

Este cambio vuelve obsoletas varias referencias antiguas a `grupos operativos por fecha`.

## 4. Fuentes de datos actuales

### 4.1. Supabase como fuente principal

Supabase ya es la fuente principal en:

- productos
- detalle de producto
- calendario operativo
- cupones de producto
- usuarios
- agencias
- reservas base
- solicitudes de ampliacion de cupo
- autenticacion y roles del panel

### 4.2. Mock o soporte local que sigue vigente

Todavia siguen vigentes de forma parcial:

- mocks de IA para los wizards de creacion
- cupones de cliente mock
- algunos archivos de `src/data/` usados como soporte visual o fallback editorial

### 4.3. Legacy ya retirado o reducido

La capa legacy de productos basada en `localStorage` ya no es fuente operativa.

Se limpiaron o desacoplaron los repositorios antiguos de productos, y el flujo actual de catalogo/productos trabaja en modo `Supabase only`.

## 5. Estado por modulo

### 5.1. Productos

Estado: **operativo sobre Supabase**

Ya existe:

- lectura admin
- detalle admin
- permisos por rol y por tipo de agencia
- detalle publico
- estados comerciales y operativos base
- historial de activacion e inhabilitacion

Diagnostico:

El modulo de productos ya no debe verse como pendiente de migracion. Debe verse como base estabilizada sobre la que ahora crecen reservas y postventa.

### 5.2. Calendario operativo

Estado: **parcial avanzado**

Ya existe:

- vista mensual
- rango activo inicial
- cupo base por activacion
- fechas operables / inactivas
- temporadas altas futuras
- bitacora operativa
- bloqueo por reservas activas
- ocupacion visual por fecha

Pendiente:

- consolidar mejor el flujo de reactivacion critica
- indicadores visuales de solicitudes de ampliacion
- endurecer algunas reglas administrativas

Diagnostico:

El calendario ya no esta pendiente desde cero. Ya paso a una fase de consolidacion funcional.

### 5.3. Reservas

Estado: **base implementada**

Ya existe:

- modulo de reservas
- creacion base
- alcance por rol
- validacion de disponibilidad por fecha
- solicitudes de ampliacion cuando no alcanza el cupo
- aprobacion/rechazo de solicitudes y ajuste de `capacity_override`

Pendiente:

- detalle completo de reserva
- historial formal de estados
- pasajeros con mayor profundidad operativa
- acciones de imprimir / enviar
- integracion fuerte con cancelaciones y reembolsos

Diagnostico:

Reservas ya no debe figurar como modulo inexistente. El siguiente paso real es madurar su detalle y su maquina de estados.

### 5.4. Cupones de producto

Estado: **operativo sobre Supabase**

Ya existe:

- CRUD basico
- lectura desde panel y producto
- visibilidad por contexto

Pendiente:

- relacion posterior con reservas reales cuando aplique

### 5.5. Cupones de cliente

Estado: **mock**

Diagnostico:

Sigue bien dejarlo fuera del backend real hasta que se cierre cancelacion, no show y reembolso.

### 5.6. Agencias y usuarios

Estado: **operativo base en panel**

Ya existe:

- CRUD base de agencias
- CRUD base de usuarios
- alcance por rol
- perfil con foto
- diferenciacion entre `super_user`, `agency_admin` y `travel_agent`

Pendiente:

- detalle mas profundo de agencia
- reactivacion / flujos administrativos mas finos
- pulido visual y de experiencia

Diagnostico:

Este modulo ya no debe aparecer como pendiente de frontend. Ya existe y esta funcionando.

### 5.7. Notificaciones de reserva

Estado: **operativo sobre Supabase**

Ya existe:

- generacion automatica de notificaciones por vencimiento de reserva
- bandeja en campanita del header
- bandeja persistente dentro del panel de control
- lectura y marcado por usuario autenticado
- sincronizacion inmediata entre campanita y panel
- filtro de campanita para mostrar solo no leidas
- RLS por destinatario real
- modelo consolidado de una sola notificacion por evento de reserva

Diagnostico:

Este frente ya no esta en exploracion. Quedo cerrada la base tecnica y funcional de notificaciones para reservas vencidas y lectura por usuario.

### 5.8. Acceso al panel y sesion

Estado: **operativo con timeout automatico**

Ya existe:

- login contra Supabase Auth
- carga de perfil desde `public.users`
- cierre manual de sesion
- expiracion automatica de sesion a los 30 minutos desde el login
- mensaje claro de expiracion al volver al formulario de acceso

Diagnostico:

La sesion del panel ya no depende solo del `jwt_expiry` por defecto. La app ahora impone cierre automatico para proteger el acceso operativo.

## 6. Brechas reales vigentes

Las brechas principales ahora son:

- detalle completo de reserva
- estados y trazabilidad de reserva
- cancelaciones completas y parciales
- reembolsos
- reacomodaciones
- cupones de cliente reales
- lista de pasajeros
- check-in
- alianzas
- reporteria
- politicas de expiracion de sesion reforzadas tambien del lado servidor en el proyecto remoto de Supabase, si se desea que la caducidad no dependa solo del frontend

## 7. Siguiente paso recomendado

El siguiente paso mas coherente con el estado actual del sistema es:

1. consolidar `detalle de reserva`
2. cerrar `maquina de estados de reserva`
3. abrir el frente de `cancelaciones / reembolsos / reacomodaciones`
4. definir si el timeout de 30 minutos tambien debe forzarse en la configuracion remota de Supabase Auth

## 8. Nota de mantenimiento documental

Todo documento que siga hablando de:

- integracion pendiente de productos
- integracion pendiente de usuarios y agencias
- notificaciones de reserva como frente no iniciado
- sesion del panel sin expiracion controlada
- o `grupos operativos por fecha`

debe considerarse desactualizado y debe alinearse al modelo vigente de:

- Supabase como fuente principal
- calendario operativo ya existente
- reservas base ya implementadas
- cupos por fecha con solicitudes de ampliacion
