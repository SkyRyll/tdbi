const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mysql = require("mysql2/promise");

const config = require("./config.json");

const OUTPUT_DIR = path.join(__dirname, "static", "images");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "sources.csv");

const REQUEST_DELAY = 1500;
const MAX_RETRIES = 5;

const USER_AGENT = "TDBI-Image-Importer/1.0 (https://github.com/SkyRyll/tdbi)";

const aliases = {
    "Lasiocyano sazimai": "Pterinopelma sazimai",
    "Vitalius chromatus": "Nhandu chromatus",
    "Homoeomma chilense": "Euathlus sp. red",
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(value) {
    if (!value) {
        return "";
    }

    return value
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

function csvEscape(value) {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`    Request attempt ${attempt}/${retries}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "User-Agent": USER_AGENT,
                    ...(options.headers || {}),
                },
            });

            if (response.ok) {
                console.log(`    HTTP ${response.status} OK`);
                return response;
            }

            console.log(`    HTTP ${response.status} ${response.statusText}`);

            const retryable = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;

            if (!retryable) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            if (attempt === retries) {
                throw new Error(`HTTP ${response.status} after ${retries} attempts`);
            }

            const retryAfter = response.headers.get("retry-after");

            let waitTime;

            if (retryAfter) {
                const retrySeconds = Number(retryAfter);

                if (!Number.isNaN(retrySeconds)) {
                    waitTime = retrySeconds * 1000;
                }
            }

            if (!waitTime) {
                waitTime = Math.pow(2, attempt - 1) * 3000;
            }

            console.log(`    Waiting ${waitTime / 1000}s before retry...`);

            await sleep(waitTime);
        } catch (error) {
            console.log(`    Request failed: ${error.message}`);

            if (attempt === retries) {
                throw error;
            }

            const waitTime = Math.pow(2, attempt - 1) * 3000;

            console.log(`    Retrying in ${waitTime / 1000}s...`);

            await sleep(waitTime);
        }
    }

    throw new Error("Request failed after all retries");
}

async function searchCommons(speciesName) {
    const searchName = aliases[speciesName] ?? speciesName;

    console.log(`    Search term: "${searchName}"`);

    const params = new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        maxlag: "5",

        generator: "search",
        gsrsearch: `"${searchName}"`,
        gsrnamespace: "6",
        gsrlimit: "10",

        prop: "imageinfo",
        iiprop: "url|mime|extmetadata",

        iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl",
    });

    const url = "https://commons.wikimedia.org/w/api.php?" + params.toString();

    const response = await fetchWithRetry(url);

    const data = await response.json();

    if (data.error) {
        throw new Error(`Commons API: ${data.error.code} - ${data.error.info}`);
    }

    if (!data.query?.pages) {
        console.log("    Commons returned no pages.");
        return null;
    }

    const pages = Object.values(data.query.pages);

    console.log(`    Commons returned ${pages.length} search result(s)`);

    const validImages = pages.filter((page) => {
        const info = page.imageinfo?.[0];

        if (!info) {
            return false;
        }

        if (!info.url) {
            return false;
        }

        if (!info.mime?.startsWith("image/")) {
            return false;
        }

        return true;
    });

    console.log(`    ${validImages.length} valid image result(s)`);

    if (validImages.length === 0) {
        return null;
    }

    return validImages[0];
}

async function downloadImage(url) {
    const response = await fetchWithRetry(url);

    const contentType = response.headers.get("content-type");

    console.log(`    Content-Type: ${contentType}`);

    if (contentType && !contentType.startsWith("image/")) {
        throw new Error(`Downloaded content is not an image: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
}

async function saveCover(buffer, outputPath) {
    await sharp(buffer)
        .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
        })
        .png({
            compressionLevel: 9,
        })
        .toFile(outputPath);
}

async function getCatalogEntries(connection) {
    const query = `
        SELECT
            catalog.catalog_id,
            catalog.scientific_name,
            catalog.common_name,
            catalog.category,
            catalog.origin,
            catalog.created_at,
            catalog.deleted_at,
            catalog_images.catalog_image_path
        FROM catalog
        LEFT JOIN catalog_images
            ON catalog.catalog_id = catalog_images.catalog_id
            AND catalog_images.is_main_image = 1
        WHERE catalog.deleted_at IS NULL
        ORDER BY catalog.scientific_name ASC;
    `;

    const [rows] = await connection.execute(query);

    return rows;
}

async function main() {
    console.log("");
    console.log("============================================================");
    console.log("TDBI TARANTULA IMAGE DOWNLOADER");
    console.log("============================================================");

    fs.mkdirSync(OUTPUT_DIR, {
        recursive: true,
    });

    console.log("Connecting to database...");

    const connection = await mysql.createConnection({
        host: config.databaseCredentials.host,
        user: config.databaseCredentials.user,
        password: config.databaseCredentials.password,
        database: config.databaseCredentials.databaseName,
        port: config.databaseCredentials.port,
    });

    console.log("✓ Database connected");

    console.log("");
    console.log("Loading catalog entries...");

    const catalogEntries = await getCatalogEntries(connection);

    console.log(`✓ Found ${catalogEntries.length} active catalog entries`);

    await connection.end();

    console.log("✓ Database connection closed");

    console.log("");
    console.log(`Output:        ${OUTPUT_DIR}`);
    console.log(`Request delay: ${REQUEST_DELAY}ms`);
    console.log(`Max retries:   ${MAX_RETRIES}`);

    console.log("============================================================");

    const manifest = [];

    let successful = 0;
    let skipped = 0;
    let notFound = 0;
    let failed = 0;

    const startTime = Date.now();

    for (let index = 0; index < catalogEntries.length; index++) {
        const entry = catalogEntries[index];

        const catalogId = entry.catalog_id;
        const speciesName = entry.scientific_name;

        console.log("");
        console.log("============================================================");

        console.log(`[${index + 1}/${catalogEntries.length}] Catalog ID ${catalogId}: ${speciesName}`);

        console.log("============================================================");

        const folder = path.join(OUTPUT_DIR, String(catalogId));

        fs.mkdirSync(folder, {
            recursive: true,
        });

        const outputPath = path.join(folder, "cover.png");

        /*
         * IMPORTANT:
         * Check the actual filesystem before making
         * any request to Wikimedia.
         */
        if (fs.existsSync(outputPath)) {
            console.log(`[${catalogId}] ✓ cover.png already exists`);

            console.log(`[${catalogId}] Skipping Wikimedia request`);

            skipped++;

            manifest.push({
                catalogId,
                speciesName,
                status: "SKIPPED - ALREADY EXISTS",
            });

            continue;
        }

        console.log(`[${catalogId}] cover.png not found`);

        console.log(`[${catalogId}] Starting Wikimedia lookup...`);

        try {
            const page = await searchCommons(speciesName);

            if (!page) {
                console.log(`[${catalogId}] ❌ NO IMAGE FOUND`);

                notFound++;

                manifest.push({
                    catalogId,
                    speciesName,
                    status: "NOT FOUND",
                });

                continue;
            }

            const info = page.imageinfo[0];

            const metadata = info.extmetadata ?? {};

            console.log(`[${catalogId}] ✓ IMAGE FOUND`);

            console.log(`[${catalogId}] Commons file: ${page.title}`);

            console.log(`[${catalogId}] MIME: ${info.mime}`);

            console.log("");
            console.log(`[${catalogId}] Downloading image...`);

            console.log(`[${catalogId}] ${info.url}`);

            const downloadStart = Date.now();

            const imageBuffer = await downloadImage(info.url);

            const downloadTime = ((Date.now() - downloadStart) / 1000).toFixed(2);

            console.log(`[${catalogId}] ✓ DOWNLOAD COMPLETE`);

            console.log(`[${catalogId}] Size: ${Math.round(imageBuffer.length / 1024)} KB`);

            console.log(`[${catalogId}] Download time: ${downloadTime}s`);

            console.log("");
            console.log(`[${catalogId}] Converting to cover.png...`);

            const conversionStart = Date.now();

            await saveCover(imageBuffer, outputPath);

            const conversionTime = ((Date.now() - conversionStart) / 1000).toFixed(2);

            console.log(`[${catalogId}] ✓ CONVERSION COMPLETE`);

            console.log(`[${catalogId}] Conversion time: ${conversionTime}s`);

            console.log(`[${catalogId}] Saved: ${outputPath}`);

            manifest.push({
                catalogId,
                speciesName,
                status: "OK",
                commonsTitle: page.title,
                sourceUrl: info.descriptionurl ?? info.url,
                fileUrl: info.url,
                author: stripHtml(metadata.Artist?.value),
                license: stripHtml(metadata.LicenseShortName?.value),
                licenseUrl: metadata.LicenseUrl?.value ?? "",
            });

            successful++;

            console.log("");
            console.log(`[${catalogId}] ✓ FINISHED ${speciesName}`);
        } catch (error) {
            failed++;

            console.error("");
            console.error(`[${catalogId}] ❌ ERROR`);

            console.error(`[${catalogId}] ${error.message}`);

            manifest.push({
                catalogId,
                speciesName,
                status: `ERROR: ${error.message}`,
            });
        }

        const processed = index + 1;

        const progress = Math.round((processed / catalogEntries.length) * 100);

        console.log("");
        console.log("------------------------------------------------------------");

        console.log(`[PROGRESS] ${processed}/${catalogEntries.length} (${progress}%)`);

        console.log(`[STATUS] Downloaded: ${successful} | Skipped: ${skipped} | Not found: ${notFound} | Errors: ${failed}`);

        console.log("------------------------------------------------------------");

        /*
         * Only wait if we actually performed
         * a Wikimedia request.
         *
         * Existing images skip instantly.
         */
        if (index < catalogEntries.length - 1) {
            console.log(`Waiting ${REQUEST_DELAY}ms before next request...`);

            await sleep(REQUEST_DELAY);
        }
    }

    console.log("");
    console.log("============================================================");
    console.log("WRITING SOURCE MANIFEST");
    console.log("============================================================");

    const csvHeader = ["catalog_id", "scientific_name", "status", "commons_title", "source_url", "file_url", "author", "license", "license_url"];

    const csvRows = manifest.map((entry) => [entry.catalogId, entry.speciesName, entry.status, entry.commonsTitle ?? "", entry.sourceUrl ?? "", entry.fileUrl ?? "", entry.author ?? "", entry.license ?? "", entry.licenseUrl ?? ""].map(csvEscape).join(","));

    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("");
    console.log("============================================================");
    console.log("DONE");
    console.log("============================================================");

    console.log(`Catalog entries: ${catalogEntries.length}`);

    console.log(`Downloaded:      ${successful}`);

    console.log(`Already existed: ${skipped}`);

    console.log(`Not found:       ${notFound}`);

    console.log(`Errors:          ${failed}`);

    console.log(`Time:            ${totalSeconds}s`);

    console.log("");

    console.log(`Images:   ${OUTPUT_DIR}`);

    console.log("============================================================");
}

main().catch((error) => {
    console.error("");
    console.error("FATAL ERROR");
    console.error(error);

    process.exit(1);
});
