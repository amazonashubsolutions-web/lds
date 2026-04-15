# LDS - Plan de Integracion a Supabase por Fases

Fecha: 2026-04-13

## 1. Objetivo

Actualizar la ruta de integracion a Supabase segun el estado real del proyecto y evitar volver a planear trabajo que ya esta cerrado.

## 2. Estado real actual

Hoy LDS ya tiene implementado sobre Supabase:

- autenticacion real del panel
- catalogo publico
- detalle publico de producto
- productos admin
- calendario operativo base
- cupones de producto
- usuarios
- agencias
- reservas base
- solicitudes de ampliacion de cupo

Esto significa que la integracion ya avanzo mucho mas alla de la preparacion tecnica inicial.

## 3. Principios vigentes

1. no rehacer modulos que ya funcionan
2. mantener `Supabase only` en modulos ya migrados
3. usar `src/services/` como capa oficial de acceso
4. tratar migraciones y RLS como fuente oficial del backend
5. enfocar el siguiente desarrollo en modulos operativos y no en reconectar bases ya cerradas

## 4. Estado por fase

### Fase 0 - Preparacion tecnica

Estado: **completada**

### Fase 1 - Productos admin y catalogo

Estado: **completada**

Incluye:

- lectura y detalle admin
- lectura y detalle publico
- permisos por rol
- estado comercial del producto

### Fase 2 - Cupones de producto

Estado: **completada**

### Fase 3 - Acceso, usuarios y agencias

Estado: **operativa base**

Ya existe:

- autenticacion
- perfiles
- CRUD base de usuarios
- CRUD base de agencias
- gestion basica de foto

Pendiente:

- detalle mas profundo de agencia
- flujos administrativos finos

### Fase 4 - Calendario operativo

Estado: **parcial avanzado**

Ya existe:

- rangos activos
- cupo base por activacion
- `capacity_override`
- temporadas altas futuras
- bitacora
- bloqueo por reservas activas

Pendiente:

- consolidar experiencia y reglas criticas
- mejorar integracion visual con solicitudes de ampliacion

### Fase 5 - Reservas

Estado: **base implementada**

Ya existe:

- listado
- creacion base
- alcance por rol
- solicitudes de ampliacion por falta de cupo

Pendiente:

- detalle completo
- historial
- pasajeros
- impresion / envio
- estados mas profundos

### Fase 6 - Postventa real

Estado: **pendiente**

Alcance:

- cancelaciones
- reembolsos
- reacomodaciones
- no show
- cupones de cliente reales

### Fase 7 - Operacion diaria

Estado: **pendiente**

Alcance:

- listas de pasajeros
- check-in
- cierre operativo por salida

### Fase 8 - Alianzas

Estado: **pendiente**

### Fase 9 - Reportes

Estado: **pendiente**

## 5. Ajuste funcional importante

El modelo vigente de disponibilidad es:

- cupo base por rango activo
- `capacity_override` por fecha
- `capacity_requests` para ampliacion

Por lo tanto:

- ya no usamos `grupos por fecha`
- ya no usamos ocupacion por grupo abierto
- la capacidad se administra por fecha

## 6. Nuevo orden recomendado de ejecucion

1. detalle de reserva
2. maquina de estados de reserva
3. cancelaciones, reembolsos y reacomodaciones
4. lista de pasajeros y check-in
5. alianzas
6. reportes
7. profundizacion administrativa de agencias y usuarios

## 7. Cronograma sugerido desde el estado actual

### Sprint A - Reserva completa

- detalle de reserva
- historial
- pasajeros
- acciones base

### Sprint B - Estados y postventa inicial

- estados formales
- cancelacion
- reembolso
- reacomodacion

### Sprint C - Operacion diaria

- listas de pasajeros
- check-in
- novedades

### Sprint D - Alianzas

- creacion
- listado
- movimientos

### Sprint E - Reportes y cierre administrativo

- ventas
- novedades
- reembolsos
- alianzas
- consolidacion de usuarios y agencias

## 8. Conclusion

La integracion a Supabase ya supero su etapa inicial en LDS.

El nuevo plan ya no debe tratar productos, catalogo, calendario base, usuarios, agencias y cupones de producto como frentes principales pendientes. El foco correcto ahora es:

1. reservas completas
2. postventa
3. operacion diaria
4. reporteria y alianzas
