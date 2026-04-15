import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  productSubcategories,
  productSubcategoryLinks,
  productsCatalog,
} from "../src/data/productsData.js";
import { getDetalleProducto } from "../src/data/detalleProductoData.js";

const PRODUCT_NAMESPACE = "0c6b7e24-0f67-5d59-b39c-2c6cf738f011";
const SUBCATEGORY_NAMESPACE = "4c84ad13-6a97-5917-a0fc-9fca89f0da95";
const GALLERY_NAMESPACE = "65d78e34-bf88-5d89-801f-8e4ca8299151";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_OUTPUT_PATH = path.resolve(
  __dirname,
  "../supabase/seeds/frontend_products_seed.sql",
);
const DEFAULT_MAP_PATH = path.resolve(
  __dirname,
  "../supabase/seeds/frontend_product_legacy_map.json",
);

function printUsage() {
  console.log(`
Uso:
  node scripts/generate-frontend-products-seed.mjs \\
    --provider-agency-id <uuid> \\
    --created-by-user-id <uuid> \\
    [--output <ruta_sql>] \\
    [--map-output <ruta_json>]

Ejemplo:
  node scripts/generate-frontend-products-seed.mjs \\
    --provider-agency-id 58e4b523-fae9-4107-9e21-9badc5e20ec0 \\
    --created-by-user-id daee32ec-6185-48a4-9853-20ea286ba09c
`);
}

function parseArgs(argv) {
  const args = {
    output: DEFAULT_OUTPUT_PATH,
    mapOutput: DEFAULT_MAP_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextToken = argv[index + 1];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--provider-agency-id") {
      args.providerAgencyId = nextToken;
      index += 1;
      continue;
    }

    if (token === "--created-by-user-id") {
      args.createdByUserId = nextToken;
      index += 1;
      continue;
    }

    if (token === "--output") {
      args.output = path.resolve(process.cwd(), nextToken);
      index += 1;
      continue;
    }

    if (token === "--map-output") {
      args.mapOutput = path.resolve(process.cwd(), nextToken);
      index += 1;
      continue;
    }

    throw new Error(`Argumento no soportado: ${token}`);
  }

  return args;
}

function assertUuid(value, label) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(String(value ?? "").trim())) {
    throw new Error(`El argumento ${label} debe ser un UUID valido.`);
  }
}

function uuidToBytes(uuid) {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function bytesToUuid(bytes) {
  const hex = Buffer.from(bytes).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function uuidV5(name, namespace) {
  const namespaceBytes = uuidToBytes(namespace);
  const hash = crypto.createHash("sha1");
  hash.update(namespaceBytes);
  hash.update(name);

  const bytes = Buffer.from(hash.digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuid(bytes);
}

function escapeSqlString(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function sqlString(value) {
  return `'${escapeSqlString(value)}'`;
}

function sqlNullableString(value) {
  const normalized = String(value ?? "").trim();
  return normalized ? sqlString(normalized) : "null";
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value ?? null))}::jsonb`;
}

function buildMeetingPoint(detail, product) {
  const pointMeta = detail.meta.find(
    (item) =>
      item.label === "Punto de encuentro" || item.label === "Ubicacion",
  );

  if (pointMeta?.value) {
    return pointMeta.value;
  }

  return `Punto de encuentro en ${product.city}`;
}

function extractTimeValue(detail, targetLabel) {
  const matchedMeta = detail.meta.find((item) => item.label === targetLabel);

  if (!matchedMeta?.value) {
    return null;
  }

  const normalized = matchedMeta.value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();

  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*([ap])\s*m$/);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3];

  if (meridiem === "p" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "a" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}

function buildDefaultTimes(product) {
  switch (product.categoryId) {
    case "actividades":
      return { departure: "07:00:00", arrival: "17:00:00" };
    case "transporte":
      return { departure: "08:00:00", arrival: "18:00:00" };
    case "restaurantes":
      return { departure: "12:30:00", arrival: "21:00:00" };
    case "planes":
      return { departure: "05:00:00", arrival: "20:00:00" };
    case "excursiones":
      return { departure: "06:30:00", arrival: "18:00:00" };
    default:
      return { departure: "08:00:00", arrival: "17:00:00" };
  }
}

function buildProductRows(providerAgencyId, createdByUserId) {
  return productsCatalog.map((product) => {
    const detail = getDetalleProducto(product.id);
    const productUuid = uuidV5(`frontend-product:${product.id}`, PRODUCT_NAMESPACE);
    const defaultTimes = buildDefaultTimes(product);
    const departureTime =
      extractTimeValue(detail, "Hora de salida") ?? defaultTimes.departure;
    const arrivalTime =
      extractTimeValue(detail, "Hora de regreso") ?? defaultTimes.arrival;

    return {
      legacyId: product.id,
      productUuid,
      providerAgencyId,
      createdByUserId,
      detail,
      product,
      meetingPoint: buildMeetingPoint(detail, product),
      departureTime,
      arrivalTime,
    };
  });
}

function buildSubcategoryRows() {
  return productSubcategories.map((subcategory, index) => ({
    ...subcategory,
    uuid: uuidV5(
      `frontend-subcategory:${subcategory.categoryId}:${subcategory.id}`,
      SUBCATEGORY_NAMESPACE,
    ),
    sortOrder: index,
  }));
}

function buildSubcategoryMap(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function createSubcategoriesSql(subcategoryRows) {
  const values = subcategoryRows
    .map(
      (row) => `  (
    ${sqlString(row.uuid)},
    ${sqlString(row.categoryId)},
    ${sqlString(row.id)},
    ${sqlString(row.label)},
    ${row.sortOrder}
  )`,
    )
    .join(",\n");

  return `insert into public.product_subcategories (
  id,
  category_key,
  subcategory_key,
  nombre,
  sort_order
)
values
${values}
on conflict (id) do update
set category_key = excluded.category_key,
    subcategory_key = excluded.subcategory_key,
    nombre = excluded.nombre,
    sort_order = excluded.sort_order;`;
}

function createProductsSql(productRows) {
  const values = productRows
    .map(
      ({ productUuid, providerAgencyId, createdByUserId, product, detail, meetingPoint, departureTime, arrivalTime }) => `  (
    ${sqlString(productUuid)},
    ${sqlString(providerAgencyId)},
    ${sqlString(product.name)},
    ${sqlString(product.city)},
    ${sqlString(meetingPoint)},
    ${sqlString(detail.summary)},
    ${sqlString(departureTime)},
    ${sqlString(arrivalTime)},
    ${sqlString(product.status)},
    ${sqlString(createdByUserId)},
    ${sqlString(product.region)},
    ${sqlString(product.categoryId)},
    ${sqlString(product.pricingLabel)},
    ${sqlString(product.pricingUnitLabel)},
    ${sqlNullableString(product.coverImageUrl)},
    ${product.isFeatured ? "true" : "false"}
  )`,
    )
    .join(",\n");

  return `insert into public.products (
  id,
  provider_agency_id,
  nombre,
  ciudad,
  punto_encuentro,
  descripcion_breve,
  hora_salida,
  hora_llegada,
  status,
  created_by,
  region,
  category_key,
  pricing_label,
  pricing_unit_label,
  cover_image_url,
  is_featured
)
values
${values}
on conflict (id) do update
set provider_agency_id = excluded.provider_agency_id,
    nombre = excluded.nombre,
    ciudad = excluded.ciudad,
    punto_encuentro = excluded.punto_encuentro,
    descripcion_breve = excluded.descripcion_breve,
    hora_salida = excluded.hora_salida,
    hora_llegada = excluded.hora_llegada,
    status = excluded.status,
    region = excluded.region,
    category_key = excluded.category_key,
    pricing_label = excluded.pricing_label,
    pricing_unit_label = excluded.pricing_unit_label,
    cover_image_url = excluded.cover_image_url,
    is_featured = excluded.is_featured,
    updated_at = now();`;
}

function createProductDetailSql(productRows) {
  const values = productRows
    .map(
      ({ productUuid, createdByUserId, detail }) => `  (
    ${sqlString(productUuid)},
    ${sqlString(detail.slug)},
    ${sqlNullableString(detail.eyebrow)},
    ${sqlString(detail.summary)},
    ${sqlJson(detail.meta)},
    ${sqlJson(detail.overview)},
    ${sqlJson(detail.itinerary)},
    ${sqlJson(detail.includes)},
    ${sqlJson(detail.excludes)},
    ${sqlJson(detail.recommendations)},
    ${sqlJson(detail.considerations)},
    ${sqlJson(detail.cancellationPolicies)},
    ${sqlJson(detail.booking)},
    ${sqlString(createdByUserId)}
  )`,
    )
    .join(",\n");

  return `insert into public.product_detail_content (
  product_id,
  slug,
  eyebrow,
  summary,
  meta,
  overview,
  itinerary,
  includes,
  excludes,
  recommendations,
  considerations,
  cancellation_policies,
  booking_config,
  updated_by_user_id
)
values
${values}
on conflict (product_id) do update
set slug = excluded.slug,
    eyebrow = excluded.eyebrow,
    summary = excluded.summary,
    meta = excluded.meta,
    overview = excluded.overview,
    itinerary = excluded.itinerary,
    includes = excluded.includes,
    excludes = excluded.excludes,
    recommendations = excluded.recommendations,
    considerations = excluded.considerations,
    cancellation_policies = excluded.cancellation_policies,
    booking_config = excluded.booking_config,
    updated_by_user_id = excluded.updated_by_user_id,
    updated_at = now();`;
}

function createProductGallerySql(productRows) {
  const values = productRows
    .flatMap(({ legacyId, productUuid, createdByUserId, detail }) =>
      detail.galleryEntries.map((image) => ({
        id: uuidV5(
          `frontend-gallery:${legacyId}:${image.position}:${image.url}`,
          GALLERY_NAMESPACE,
        ),
        productUuid,
        createdByUserId,
        image,
      })),
    )
    .map(
      ({ id, productUuid, createdByUserId, image }) => `  (
    ${sqlString(id)},
    ${sqlString(productUuid)},
    ${sqlString(image.url)},
    ${sqlNullableString(image.fileName)},
    ${Number(image.position)},
    ${image.isPrimary ? "true" : "false"},
    ${sqlString(createdByUserId)}
  )`,
    )
    .join(",\n");

  return `insert into public.product_gallery_images (
  id,
  product_id,
  image_url,
  file_name,
  position,
  is_primary,
  created_by_user_id
)
values
${values}
on conflict (product_id, position) do update
set image_url = excluded.image_url,
    file_name = excluded.file_name,
    is_primary = excluded.is_primary,
    created_by_user_id = excluded.created_by_user_id,
    updated_at = now();`;
}

function createProductLinksSql(productRows, subcategoryMap) {
  const productUuidMap = new Map(
    productRows.map((row) => [row.legacyId, row.productUuid]),
  );
  const values = productSubcategoryLinks
    .map((link) => {
      const productUuid = productUuidMap.get(link.productId);
      const subcategory = subcategoryMap.get(link.subcategoryId);

      if (!productUuid || !subcategory) {
        throw new Error(
          `No se pudo resolver el link producto/subcategoria para productId=${link.productId}, subcategoryId=${link.subcategoryId}`,
        );
      }

      return `  (
    ${sqlString(productUuid)},
    ${sqlString(subcategory.uuid)}
  )`;
    })
    .join(",\n");

  const productUuidList = productRows.map((row) => sqlString(row.productUuid)).join(", ");

  return `delete from public.product_subcategory_links
where product_id in (${productUuidList});

insert into public.product_subcategory_links (
  product_id,
  product_subcategory_id
)
values
${values}
on conflict (product_id, product_subcategory_id) do nothing;`;
}

function createGalleryCleanupSql(productRows) {
  const productUuidList = productRows.map((row) => sqlString(row.productUuid)).join(", ");
  return `delete from public.product_gallery_images
where product_id in (${productUuidList});`;
}

function createSeedSql(productRows, subcategoryRows) {
  const subcategoryMap = buildSubcategoryMap(subcategoryRows);

  return `-- Generated by scripts/generate-frontend-products-seed.mjs
-- Base seed generated from src/data/productsData.js and src/data/detalleProductoData.js
-- This script does not include browser localStorage overrides.

begin;

${createSubcategoriesSql(subcategoryRows)}

${createProductsSql(productRows)}

${createProductDetailSql(productRows)}

${createGalleryCleanupSql(productRows)}

${createProductGallerySql(productRows)}

${createProductLinksSql(productRows, subcategoryMap)}

commit;
`;
}

function createLegacyMap(productRows, subcategoryRows) {
  return {
    generatedAt: new Date().toISOString(),
    products: productRows.map((row) => ({
      legacyId: row.legacyId,
      uuid: row.productUuid,
      name: row.product.name,
      slug: row.detail.slug,
    })),
    subcategories: subcategoryRows.map((row) => ({
      key: row.id,
      uuid: row.uuid,
      categoryId: row.categoryId,
      label: row.label,
    })),
  };
}

async function ensureParentDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  assertUuid(args.providerAgencyId, "--provider-agency-id");
  assertUuid(args.createdByUserId, "--created-by-user-id");

  const productRows = buildProductRows(
    args.providerAgencyId,
    args.createdByUserId,
  );
  const subcategoryRows = buildSubcategoryRows();
  const sql = createSeedSql(productRows, subcategoryRows);
  const legacyMap = createLegacyMap(productRows, subcategoryRows);

  await ensureParentDirectory(args.output);
  await ensureParentDirectory(args.mapOutput);
  await fs.writeFile(args.output, sql, "utf8");
  await fs.writeFile(args.mapOutput, JSON.stringify(legacyMap, null, 2), "utf8");

  console.log(`SQL generado en: ${args.output}`);
  console.log(`Mapa legacy generado en: ${args.mapOutput}`);
  console.log(
    `Productos base preparados: ${productRows.length}. Subcategorias preparadas: ${subcategoryRows.length}.`,
  );
  console.log("Nota: este seed no incluye datos del localStorage del navegador.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
