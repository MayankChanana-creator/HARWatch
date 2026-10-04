/**
 * HARWatch Parser
 *
 * Responsibilities:
 * 1. Read HAR files
 * 2. Validate HAR structure
 * 3. Convert HAR entries into a clean data model
 */


/**
 * Read a HAR file and convert it into a JavaScript object.
 *
 * @param {File} file
 * @returns {Promise<Object>}
 */
function readHarFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file was selected."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const har = JSON.parse(reader.result);

                validateHar(har);

                resolve(har);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error("Could not read the file."));
        };

        reader.readAsText(file);
    });
}


/**
 * Validate that an object follows the basic HAR structure.
 *
 * @param {Object} har
 * @returns {boolean}
 */
function validateHar(har) {
    if (!har || typeof har !== "object" || Array.isArray(har)) {
        throw new Error("The file does not contain a valid HAR object.");
    }

    if (!har.log || typeof har.log !== "object") {
        throw new Error("Invalid HAR file: missing 'log' object.");
    }

    if (!Array.isArray(har.log.entries)) {
        throw new Error(
            "Invalid HAR file: 'log.entries' must be an array."
        );
    }

    return true;
}


/**
 * Convert a HAR object into HARWatch's clean data model.
 *
 * @param {Object} har
 * @returns {Object}
 */
function parseHar(har) {
    validateHar(har);

    const entries = har.log.entries;

    const requests = entries.map((entry, index) => {
        const request = entry.request || {};
        const response = entry.response || {};
        const timing = entry.timings || {};

        return {
            id: index + 1,

            url: request.url || "",
            method: request.method || "GET",

            status: response.status || 0,
            statusText: response.statusText || "",

            mimeType: response.content?.mimeType || "",

            requestSize: request.bodySize || 0,
            responseSize: response.bodySize || 0,

            responseHeaders: response.headers || [],

            startedDateTime: entry.startedDateTime || "",

            time: entry.time || 0,

            timings: {
                blocked: timing.blocked || 0,
                dns: timing.dns || 0,
                connect: timing.connect || 0,
                send: timing.send || 0,
                wait: timing.wait || 0,
                receive: timing.receive || 0,
                ssl: timing.ssl || 0
            },

            cache: {
                beforeRequest: entry.cache?.beforeRequest || {},
                afterRequest: entry.cache?.afterRequest || {}
            },

            serverIPAddress: entry.serverIPAddress || "",

            connection: entry.connection || "",

            httpVersion: response.httpVersion || "",

            redirectURL: response.redirectURL || ""
        };
    });

    return {
        version: har.log.version || "",
        creator: har.log.creator || {},
        requests: requests
    };
}


/**
 * Expose parser functions globally.
 */
window.readHarFile = readHarFile;
window.validateHar = validateHar;
window.parseHar = parseHar;