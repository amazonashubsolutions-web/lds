# Supabase Structure for LDS

Esta carpeta contiene la base tecnica vigente de backend para LDS.

## Fuente oficial del esquema

La fuente oficial del modelo de datos y de los cambios estructurales vive en:
- `migrations/`

Estas migraciones reemplazan los contratos iniciales que antes vivian en `docs/backend-contracts/`, hoy archivados en `docs/archive/backend-contracts/` solo como referencia historica.

## Relacion entre `auth.users` y `public.users`

- `auth.users` mantiene autenticacion, email y credenciales.
- `public.users` mantiene perfil de negocio, rol y relacion con agencia.
- La relacion es `1 a 1` y usa el mismo `id`.
- `public.users.id` referencia `auth.users.id`.
- Un trigger sobre `auth.users` crea o sincroniza el registro en `public.users`.

## Migraciones actuales

1. `20260409222000_auth_agencies_users.sql`
   - agencias
   - representantes legales
   - usuarios de negocio
   - relacion con `auth.users`
   - triggers de sincronizacion

2. `20260409222100_domain_tables.sql`
   - productos
   - temporadas
   - reglas de multas
   - cotizaciones
   - reservas
   - pasajeros
   - cancelaciones
   - cupones
   - reembolsos
   - listas de pasajeros
   - alianzas

3. `20260409222200_rls_helpers_and_policies.sql`
   - helper functions por rol y agencia
   - activacion de RLS
   - politicas iniciales por modulo

4. `20260410141000_backlog_alignment_schema.sql`
   - ampliaciones para alinear el modelo con el backlog y con la UI actual del frontend
   - contenido editorial del producto
   - galeria
   - historicos y eventos operativos
   - comprobantes y recordatorios de reembolso

5. `20260410141100_backlog_alignment_rls.sql`
   - ajustes de RLS para los cambios del backlog alignment

## Nota operativa

Cuando cambie el modelo real del backend:
- actualizar primero `migrations/`
- reflejar despues el impacto funcional en `docs/planning/LDS_backlog_priorizado.md` si corresponde
- no usar `docs/archive/backend-contracts/` como fuente vigente de implementacion

Si mas adelante se agrega `supabase/config.toml` o se conecta el proyecto a una instancia real, esta carpeta ya puede servir como base para `supabase db push` o flujos equivalentes.
