/**
 * HARWatch Analysis Engine
 *
 * Runs all performance rules against parsed requests.
 */

function analyzeHar(data) {
    if (!data || !Array.isArray(data.requests)) {
        throw new Error(
            "Cannot analyze HAR data: requests are missing."
        );
    }


    const findings = [];

    /*
     * Determine the hostname of the main page.
     *
     * We use the first request as the page origin.
     */

    let mainHostname = "";

    if (data.requests.length > 0) {
        try {
            const firstURL = new URL(
                data.requests[0].url
            );

            mainHostname = firstURL.hostname;
        } catch {
            mainHostname = "";
        }
    }


    /*
     * Run every rule against every request.
     */

    data.requests.forEach((request) => {

        const rules = [
            () => window.checkOversizedAsset(request),

            () => window.checkMissingCompression(request),

            () => window.checkMissingCaching(request),

            () => window.checkSlowTTFB(request),

            () => window.checkFailedRequest(request),

            () => window.checkThirdPartyRequest(
                request,
                mainHostname
            )
        ];


        rules.forEach((rule) => {
            const finding = rule();

            if (finding) {
                findings.push(finding);
            }
        });
    });


    /*
     * Add severity to every finding.
     */

    const scoredFindings = findings.map(
        addSeverity
    );


    /*
     * Summary
     */

    const summary = {
        totalRequests: data.requests.length,

        totalFindings: scoredFindings.length,

        oversizedAssets: countRule(
            scoredFindings,
            "oversized-asset"
        ),

        missingCompression: countRule(
            scoredFindings,
            "missing-compression"
        ),

        missingCaching: countRule(
            scoredFindings,
            "missing-caching"
        ),

        slowTTFB: countRule(
            scoredFindings,
            "slow-ttfb"
        ),

        failedRequests: countRule(
            scoredFindings,
            "failed-request"
        ),

        thirdPartyRequests: countRule(
            scoredFindings,
            "third-party-request"
        )
    };


    return {
        findings: scoredFindings,
        summary: summary
    };
}


/* =========================================================
   SEVERITY
   ========================================================= */

function addSeverity(finding) {

    let severity = "low";


    switch (finding.rule) {

        case "oversized-asset":
            severity = "medium";
            break;


        case "missing-compression":
            severity = "medium";
            break;


        case "missing-caching":
            severity = "low";
            break;


        case "slow-ttfb":

            if (finding.value > 1500) {
                severity = "high";
            } else {
                severity = "medium";
            }

            break;


        case "failed-request":

            if (finding.status >= 500) {
                severity = "high";
            } else {
                severity = "medium";
            }

            break;


        case "third-party-request":
            severity = "low";
            break;
    }


    return {
        ...finding,
        severity: severity
    };
}


/* =========================================================
   COUNT FINDINGS
   ========================================================= */

function countRule(findings, ruleName) {
    return findings.filter(
        (finding) => finding.rule === ruleName
    ).length;
}


window.analyzeHar = analyzeHar;