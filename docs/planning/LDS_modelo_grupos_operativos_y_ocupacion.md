# LDS - Modelo vigente de cupos por fecha y ocupacion del calendario

Fecha: 2026-04-13

## 1. Nota de continuidad

Este archivo conserva su nombre historico, pero el modelo vigente de LDS ya no usa `grupos operativos por fecha`.

El modelo correcto y activo hoy es:

- **cupo por fecha**
- **cupo base por activacion**
- **ajuste puntual por fecha (`capacity_override`)**
- **solicitud de ampliacion (`capacity_requests`)**

## 2. Regla de negocio vigente

### 2.1. Habilitacion de producto

Cuando un producto se habilita operativamente:

- el admin proveedor define:
  - fecha inicial
  - fecha final
  - cupo base por fecha
- LDS crea:
  - `product_active_ranges`
  - `product_operation_activations`
- ese `default_capacity` aplica a las fechas activas del rango

Si el producto ya fue inhabilitado y luego vuelve a habilitarse por primera vez en una nueva activacion, el sistema vuelve a pedir ese dato.

### 2.2. Disponibilidad por fecha

Cada fecha operativa toma su capacidad efectiva asi:

1. si existe `capacity_override` para esa fecha, usar ese valor
2. si no existe, usar `default_capacity` de la activacion vigente

### 2.3. Solicitud de ampliacion

Si una agencia vendedora necesita mas cupos de los disponibles:

- no crea reserva
- no crea grupo
- LDS registra una `capacity_request`
- la solicitud se dirige a la agencia proveedora duena del producto
- el admin proveedor puede aprobar o rechazar
- si aprueba, ajusta `capacity_override` de esa fecha

## 3. Modelo tecnico vigente

### 3.1. Activaciones operativas

Tabla principal:

- `product_operation_activations`

Campos relevantes:

- `product_id`
- `range_start`
- `range_end`
- `default_capacity`
- `created_by`
- `created_at`

Funcion:

- guardar el contexto del rango activo y el cupo base definido al habilitar

### 3.2. Fechas del calendario

Tabla principal:

- `product_calendar_dates`

Campo relevante:

- `capacity_override`

Funcion:

- permitir ampliar o ajustar el cupo de una fecha especifica sin cambiar todo el rango

### 3.3. Solicitudes de ampliacion

Tabla principal:

- `capacity_requests`

Campos relevantes:

- `product_id`
- `travel_date`
- `seller_agency_id`
- `provider_agency_id`
- `requested_by_user_id`
- `requested_passenger_count`
- `current_available_capacity`
- `missing_capacity`
- `reason`
- `status`

Funcion:

- registrar la necesidad previa de ampliar cupo antes de crear una reserva

## 4. Algoritmo vigente de ocupacion

Para cada `producto + fecha`:

1. identificar la capacidad efectiva de la fecha
2. sumar pasajeros activos de reservas activas en esa fecha
3. calcular:
   - `reservedSeats`
   - `availableSeats`
   - `occupancyPercentage`

Formula:

- `occupancyPercentage = reservedSeats / effectiveCapacity * 100`

Estados visuales:

- fecha operable sin reservas: celda blanca
- fecha operable con reservas: celda verde con intensidad segun ocupacion
- fecha no operable: celda roja
- temporada alta: marca negra sobre el numero del dia

## 5. Reglas complementarias

### 5.1. Quién puede ampliar cupo

- `agency_admin` de la agencia proveedora duena del producto
- `super_user`

### 5.2. Quién no puede ampliar cupo

- `travel_agent`
- agencia vendedora

Estas agencias solo pueden generar la solicitud previa.

### 5.3. Impacto sobre reservas

Si no hay cupo suficiente:

- no se crea la reserva
- se crea la solicitud
- el proveedor decide si amplía o no

## 6. Implicacion para el roadmap

Con este modelo ya no deben seguir planeandose:

- `operation_group_id`
- grupo inicial automatico
- grupo abierto
- grupos completos por fecha

El siguiente desarrollo debe construirse sobre:

- capacidad efectiva por fecha
- detalle completo de reserva
- estados de reserva
- postventa real
