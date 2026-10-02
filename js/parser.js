/**
 * Reads a HAR file and validates its structure.
 *
 * This file is responsible only for:
 * 1. Reading the file
 * 2. Parsing JSON
 * 3. Validating that it is a HAR file
 *
 * It does NOT transform HAR entries yet.
 */

/**
 * Read a File object and convert it into a JavaScript object.
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
    // Check that the parsed JSON is an object
    if (!har || typeof har !== "object" || Array.isArray(har)) {
        throw new Error("The file does not contain a valid HAR object.");
    }

    // HAR must contain a log object
    if (!har.log || typeof har.log !== "object") {
        throw new Error("Invalid HAR file: missing 'log' object.");
    }

    // HAR log must contain entries
    if (!Array.isArray(har.log.entries)) {
        throw new Error("Invalid HAR file: 'log.entries' must be an array.");
    }

    return true;
}