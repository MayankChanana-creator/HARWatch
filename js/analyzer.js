/**
 * HARWatch Analysis Engine
 *
 * Runs all performance rules against parsed requests.
 */


/**
 * Analyze the complete HARWatch data model.
 *
 * @param {Object} data
 * @returns {Object}
 */
function analyzeHar(data) {
    if (!data || !Array.isArray(data.requests)) {
        throw new Error(
            "Cannot analyze HAR data: requests are missing."
        );
    }

    const findings = [];

    data.requests.forEach((request) => {

        const rules = [
            window.checkOversizedAsset,
            window.checkMissingCompression,
            window.checkMissingCaching
        ];

        rules.forEach((rule) => {
            const finding = rule(request);

            if (finding) {
                findings.push(finding);
            }
        });
    });


    /*
     * Summary information
     */

    const summary = {
        totalRequests: data.requests.length,

        totalFindings: findings.length,

        oversizedAssets: findings.filter(
            (finding) =>
                finding.rule === "oversized-asset"
        ).length,

        missingCompression: findings.filter(
            (finding) =>
                finding.rule === "missing-compression"
        ).length,

        missingCaching: findings.filter(
            (finding) =>
                finding.rule === "missing-caching"
        ).length
    };


    return {
        findings: findings,
        summary: summary
    };
}


window.analyzeHar = analyzeHar;