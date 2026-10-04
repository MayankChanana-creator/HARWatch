/**
 * HARWatch Analysis Rules
 *
 * Contains:
 * - Rule thresholds
 * - Request classification
 * - Header helpers
 * - Individual performance checks
 */


/* =========================================================
   RULE CONFIGURATION
   ========================================================= */

const RULE_CONFIG = {

    oversizedAsset: {
        imageBytes: 200 * 1024,
        scriptBytes: 200 * 1024,
        stylesheetBytes: 200 * 1024,
        otherBytes: 500 * 1024
    },

    compressibleTypes: [
        "html",
        "css",
        "javascript",
        "json",
        "xml",
        "text"
    ],

    cacheableTypes: [
        "css",
        "javascript",
        "image",
        "font",
        "stylesheet"
    ]
};


/* =========================================================
   HEADER HELPERS
   ========================================================= */

/**
 * Find a response header by name.
 *
 * HAR headers are stored as:
 *
 * [
 *     {
 *         name: "Content-Encoding",
 *         value: "gzip"
 *     }
 * ]
 */
function getResponseHeader(request, headerName) {
    const headers = request.responseHeaders || [];

    const target = headerName.toLowerCase();

    const header = headers.find((item) => {
        return (
            typeof item.name === "string" &&
            item.name.toLowerCase() === target
        );
    });

    return header ? String(header.value || "") : "";
}


/* =========================================================
   REQUEST TYPE
   ========================================================= */

function getRuleRequestType(mimeType) {
    const type = (mimeType || "").toLowerCase();

    if (type.includes("html")) {
        return "html";
    }

    if (type.includes("css")) {
        return "css";
    }

    if (
        type.includes("javascript") ||
        type.includes("ecmascript")
    ) {
        return "javascript";
    }

    if (type.includes("json")) {
        return "json";
    }

    if (type.includes("xml")) {
        return "xml";
    }

    if (type.startsWith("image/")) {
        return "image";
    }

    if (
        type.includes("font") ||
        type.includes("woff") ||
        type.includes("ttf") ||
        type.includes("opentype")
    ) {
        return "font";
    }

    if (type.startsWith("text/")) {
        return "text";
    }

    return "other";
}


/* =========================================================
   RULE 1 — OVERSIZED ASSET
   ========================================================= */

function checkOversizedAsset(request) {
    const type = getRuleRequestType(request.mimeType);

    const size = Number(request.responseSize) || 0;

    let threshold;

    switch (type) {
        case "image":
            threshold = RULE_CONFIG.oversizedAsset.imageBytes;
            break;

        case "javascript":
            threshold = RULE_CONFIG.oversizedAsset.scriptBytes;
            break;

        case "css":
            threshold = RULE_CONFIG.oversizedAsset.stylesheetBytes;
            break;

        default:
            threshold = RULE_CONFIG.oversizedAsset.otherBytes;
    }

    if (size <= threshold) {
        return null;
    }

    return {
        rule: "oversized-asset",
        title: "Oversized asset",
        message:
            `${formatRuleBytes(size)} ${type} resource is larger ` +
            `than the recommended ${formatRuleBytes(threshold)} threshold.`,
        requestId: request.id,
        url: request.url,
        size: size,
        threshold: threshold,
        fix:
            "Compress, resize, minify, or otherwise reduce the asset size."
    };
}


/* =========================================================
   RULE 2 — MISSING COMPRESSION
   ========================================================= */

function checkMissingCompression(request) {
    const type = getRuleRequestType(request.mimeType);

    if (!RULE_CONFIG.compressibleTypes.includes(type)) {
        return null;
    }

    const size = Number(request.responseSize) || 0;

    /*
     * Tiny responses don't provide enough benefit to justify
     * reporting compression as an issue.
     */
    if (size < 1024) {
        return null;
    }

    const encoding = getResponseHeader(
        request,
        "content-encoding"
    ).toLowerCase();

    const compressed =
        encoding.includes("gzip") ||
        encoding.includes("br");

    if (compressed) {
        return null;
    }

    return {
        rule: "missing-compression",
        title: "Missing compression",
        message:
            `${type.toUpperCase()} response is not using gzip or Brotli compression.`,
        requestId: request.id,
        url: request.url,
        size: size,
        fix:
            "Enable Brotli or gzip compression for text-based responses."
    };
}


/* =========================================================
   RULE 3 — MISSING CACHING
   ========================================================= */

function checkMissingCaching(request) {
    const type = getRuleRequestType(request.mimeType);

    if (!RULE_CONFIG.cacheableTypes.includes(type)) {
        return null;
    }

    const cacheControl = getResponseHeader(
        request,
        "cache-control"
    );

    const expires = getResponseHeader(
        request,
        "expires"
    );

    if (cacheControl || expires) {
        return null;
    }

    return {
        rule: "missing-caching",
        title: "Missing caching",
        message:
            `${type.toUpperCase()} resource does not expose ` +
            "Cache-Control or Expires headers.",
        requestId: request.id,
        url: request.url,
        fix:
            "Add an appropriate Cache-Control or Expires policy for static resources."
    };
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatRuleBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.RULE_CONFIG = RULE_CONFIG;

window.getResponseHeader = getResponseHeader;
window.getRuleRequestType = getRuleRequestType;

window.checkOversizedAsset = checkOversizedAsset;
window.checkMissingCompression = checkMissingCompression;
window.checkMissingCaching = checkMissingCaching;