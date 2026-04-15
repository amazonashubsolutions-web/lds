# LDS Docs

Esta carpeta concentra la documentacion funcional y tecnica del proyecto LDS.

## Fuentes oficiales

Las fuentes activas del proyecto son:
- `planning/LDS_backlog_priorizado.md` como fuente oficial funcional, roadmap e historias
- `../supabase/migrations/` como fuente oficial del esquema real y cambios estructurales de backend
- `../supabase/README.md` como resumen tecnico del backend objetivo

Los archivos `HTML` y `PDF` dentro de `planning/` son derivados del backlog maestro en Markdown y se regeneran cuando ese archivo cambia.

## Estructura

### `analysis/`
Contiene el analisis funcional consolidado del negocio.

Archivos principales:
- `LDS_analisis_funcional_usuarios.html`
- `LDS_analisis_funcional_usuarios.pdf`
- `LDS_diagnostico_estado_actual.md`
- `LDS_matriz_ejecutiva_modulos.md`

### `planning/`
Contiene backlog, roadmap, historias, criterios de aceptacion, endpoints y ejemplos JSON.

Archivo principal:
- `LDS_backlog_priorizado.md`

Archivos complementarios:
- `LDS_plan_integracion_supabase.md`
- `LDS_validacion_backlog_vs_supabase.md`
- `LDS_modelo_grupos_operativos_y_ocupacion.md` como documento historico de nombre heredado, pero ya alineado al modelo vigente de `cupos por fecha`

Derivados:
- `LDS_backlog_priorizado.html`
- `LDS_backlog_priorizado.pdf`

### `archive/`
Contiene material historico que ya no es fuente vigente del proyecto.

Subcarpetas:
- `backend-contracts/`: contratos tecnicos iniciales usados antes de consolidar el modelo real en `supabase/migrations/`

## Reglas de mantenimiento

- actualizar primero `planning/LDS_backlog_priorizado.md` cuando cambie el alcance funcional
- reflejar cambios estructurales de backend en `../supabase/migrations/`
- usar `analysis/` para diagnosticos y decisiones, no como fuente primaria de implementacion
- tratar `archive/` como referencia historica y no como documentacion operativa vigente
- evitar duplicar contenido funcional o tecnico en varias rutas activas
