# LDS - Validacion de Backlog Cerrado vs Supabase

Fecha: 2026-04-15

## 1. Objetivo

Actualizar la validacion entre backlog y Supabase despues de los avances recientes implementados en la aplicacion y de la correccion funcional del modelo de disponibilidad.

## 2. Conclusion general

La brecha principal ya no esta en "conectar productos a Supabase". Esa fase ya esta superada.

Hoy la validacion correcta es esta:

- el modelo de Supabase ya sostiene productos, catalogo, detalle, cupones de producto, usuarios, agencias y reservas base
- el frontend ya consume esos frentes sobre backend real
- ya existe modelo real de notificaciones por reserva con lectura por usuario
- las brechas mas importantes ya no son de integracion base
- las brechas reales estan en reservas profundas, estados, cancelaciones, reembolsos, listas de pasajeros y reporteria

## 3. Frentes ya resueltos o adelantados

### 3.1. Productos y catalogo

Ya existen en la app:

- lectura publica de productos activos
- detalle publico de producto
- lectura admin de productos
- detalle admin de producto
- permisos por rol y por tipo de agencia
- gestion operativa base del producto

Implicacion:

El backlog de productos ya no bloquea la ruta de Supabase. Debe considerarse base operativa viva.

### 3.2. Cupones de producto

Ya existen:

- tabla y CRUD real
- lectura desde panel
- lectura desde producto
- migracion ya cerrada

Implicacion:

Este modulo tampoco debe seguir figurando como frente de integracion pendiente.

### 3.3. Usuarios y agencias

Ya existen en la app:

- CRUD base de usuarios
- CRUD base de agencias
- lectura por rol
- relacion con agencia
- foto de perfil

Implicacion:

El backlog debe pasar de "crear modulo" a "profundizar administracion".

### 3.4. Calendario operativo

Ya existen:

- rangos activos
- activacion con cupo base
- fechas no operables
- temporadas altas futuras
- historial operativo
- relacion con reservas activas

Implicacion:

El calendario ya no esta pendiente desde cero. Lo que sigue es consolidarlo.

### 3.5. Reservas base

Ya existen:

- modulo navegable
- creacion base
- visibilidad por rol
- solicitudes de ampliacion cuando no alcanza el cupo
- aprobacion / rechazo de ampliacion y ajuste por fecha

Implicacion:

Reservas ya no debe verse como modulo inexistente. El siguiente cierre es el detalle completo y la maquina de estados.

### 3.6. Notificaciones y sesion del panel

Ya existen:

- bandeja de notificaciones en header y panel
- marcado de lectura persistido por usuario
- RLS por destinatario real
- consolidacion de una notificacion por evento de reserva
- cierre automatico de sesion del panel a los 30 minutos

Implicacion:

Este frente ya no es un pendiente base. La brecha ya no esta en crear notificaciones, sino en ampliar cobertura de eventos y endurecer, si se desea, la expiracion tambien del lado servidor.

## 4. Ajuste funcional clave que cambia la validacion

Antes:

- el backlog y algunos documentos asumian `grupos operativos por fecha`

Hoy:

- el modelo correcto y vigente es `cupos por fecha`

Esto implica que la validacion actual debe basarse en:

- `product_operation_activations.default_capacity`
- `product_calendar_dates.capacity_override`
- `capacity_requests`
- ocupacion visual por fecha calculada con pasajeros activos / capacidad efectiva

Por lo tanto, toda referencia a:

- `operation_group_id`
- `grupo abierto`
- `grupo inicial automatico`
- `badge de grupos completos`

debe considerarse obsoleta para el roadmap vigente.

## 5. Brechas principales vigentes

### 5.1. Reservas

Sigue faltando:

- detalle completo de reserva
- historial estructurado de movimientos
- valores y medios de pago mejor resueltos
- impresion y envio
- filtros mas profundos

### 5.1.1. Estados y notificaciones

Sigue faltando:

- extender notificaciones a emitida, cancelada por usuario y en reembolso
- definir si algunas reglas tambien deben disparar email
- acoplar notificaciones a mas eventos del flujo de postventa

### 5.2. Postventa real

Siguen faltando:

- cancelaciones completas y parciales
- reacomodaciones
- reembolsos
- cupones de cliente reales
- no show

### 5.3. Operacion diaria

Siguen faltando:

- listas de pasajeros
- check-in
- cierre operativo por salida

### 5.4. Reportes y alianzas

Siguen faltando:

- consultas agregadas
- trazabilidad financiera consolidada
- modulo vivo de alianzas

## 6. Ajustes minimos recomendados para el siguiente ciclo

1. consolidar el detalle de reserva
2. definir la maquina de estados de reserva
3. pasar a cancelaciones, reacomodaciones y reembolsos
4. mantener cupones de cliente fuera del backend hasta que exista esa postventa real
5. seguir usando Supabase como fuente unica en los modulos ya migrados
6. decidir si el timeout de 30 minutos tambien se configura en el proyecto remoto de Supabase Auth

## 7. Conclusion ejecutiva

El backlog sigue siendo implementable sobre Supabase, pero la validacion ya cambio de foco.

Antes:

- el gran reto era adaptar el frontend comercial a Supabase

Ahora:

- ese frente ya esta muy adelantado
- el siguiente reto real es convertir reservas y postventa en modulos operativos completos
