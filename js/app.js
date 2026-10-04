document.addEventListener("DOMContentLoaded", () => {
    /*
     * HARWatch uses the same app.js on multiple pages.
     *
     * index.html  → upload handling
     * report.html → report rendering
     */

    const dropZone = document.getElementById("drop-zone");

    if (dropZone) {
        initializeUploadPage();
    }

    const summaryCards = document.getElementById("summary-cards");

    if (summaryCards) {
        initializeReportPage();
    }
});


/* =========================================================
   UPLOAD PAGE
   ========================================================= */

function initializeUploadPage() {
    const dropZone = document.getElementById("drop-zone");
    const browseButton = document.getElementById("browse-btn");
    const fileInput = document.getElementById("file-input");
    const errorBox = document.getElementById("upload-error");

    if (!dropZone || !browseButton || !fileInput || !errorBox) {
        return;
    }


    /*
     * Browse button
     */

    browseButton.addEventListener("click", () => {
        fileInput.click();
    });


    /*
     * File input
     */

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
            handleFile(file);
        }
    });


    /*
     * Drag over
     */

    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();

        dropZone.classList.add("dragging");
    });


    /*
     * Drag leave
     */

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
    });


    /*
     * Drop
     */

    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();

        dropZone.classList.remove("dragging");

        const file = event.dataTransfer.files[0];

        if (file) {
            handleFile(file);
        }
    });


    /*
     * Handle file
     */

    async function handleFile(file) {
        clearError();

        if (!file.name.toLowerCase().endsWith(".har")) {
            showError("Please select a .har file.");
            return;
        }

        try {
            setLoading(true);

            const har = await window.readHarFile(file);

            const parsedData = window.parseHar(har);

            const analysis = window.analyzeHar(parsedData);

            console.log("Raw HAR:", har);
            console.log("Parsed HAR:", parsedData);
            console.log("Analysis:", analysis);

            /*
             * Save the parsed analysis temporarily.
             *
             * sessionStorage keeps it available while the
             * user moves between the Upload and Report pages.
             */

            const reportData = {
                filename: file.name,
                data: parsedData,
                analysis : analysis
            };

            sessionStorage.setItem(
                "harwatch-report",
                JSON.stringify(reportData)
            );

            showSuccess(file, parsedData);

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    }


    /*
     * Error handling
     */

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
    }


    function clearError() {
        errorBox.textContent = "";
        errorBox.hidden = true;
    }


    /*
     * Loading state
     */

    function setLoading(isLoading) {
        if (isLoading) {
            browseButton.disabled = true;
            browseButton.textContent = "Reading...";
        } else {
            browseButton.disabled = false;
            browseButton.textContent = "Browse files";
        }
    }


    /*
     * Successful upload
     */

    function showSuccess(file, parsedData) {
        console.log("File name:", file.name);
        console.log("HAR version:", parsedData.version);
        console.log("Number of requests:", parsedData.requests.length);

        errorBox.textContent =
            `Valid HAR file loaded: ${file.name} ` +
            `(${parsedData.requests.length} requests)`;

        errorBox.hidden = false;
    }
}


/* =========================================================
   REPORT PAGE
   ========================================================= */

function initializeReportPage() {
    const storedReport = sessionStorage.getItem("harwatch-report");

    /*
     * No analysis has been performed in this browser session.
     */

    if (!storedReport) {
        showEmptyReport();
        return;
    }

    try {
        const report = JSON.parse(storedReport);

        renderReport(report);

    } catch (error) {
        console.error("Could not load report:", error);

        showEmptyReport();
    }
}


/*
 * Render complete report
 */

function renderReport(report) {
    const filenameElement = document.getElementById("report-filename");

    if (filenameElement) {
        filenameElement.textContent = report.filename;
    }

    const data = report.data;

    renderSummaryCards(data);
    renderTypeChart(data);
}


/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function renderSummaryCards(data) {
    const container = document.getElementById("summary-cards");

    if (!container) {
        return;
    }

    const requests = data.requests || [];

    const totalRequests = requests.length;

    const totalSize = requests.reduce((total, request) => {
        return total + (Number(request.responseSize) || 0);
    }, 0);

    const totalRequestTime = requests.reduce((total, request) => {
        return total + (Number(request.time) || 0);
    }, 0);

    const failedRequests = requests.filter((request) => {
        return request.status >= 400 || request.status === 0;
    }).length;


    container.innerHTML = `
        <article class="summary-card">
            <span class="summary-card__label">REQUESTS</span>
            <strong class="summary-card__value">
                ${totalRequests}
            </strong>
            <span class="summary-card__detail">
                Total network requests
            </span>
        </article>

        <article class="summary-card">
            <span class="summary-card__label">TRANSFERRED</span>
            <strong class="summary-card__value">
                ${formatBytes(totalSize)}
            </strong>
            <span class="summary-card__detail">
                Response body size
            </span>
        </article>

        <article class="summary-card">
            <span class="summary-card__label">REQUEST TIME</span>
            <strong class="summary-card__value">
                ${formatTime(totalRequestTime)}
            </strong>
            <span class="summary-card__detail">
                Combined request duration
            </span>
        </article>

        <article class="summary-card">
            <span class="summary-card__label">ERRORS</span>
            <strong class="summary-card__value">
                ${failedRequests}
            </strong>
            <span class="summary-card__detail">
                HTTP failures
            </span>
        </article>
    `;
}


/* =========================================================
   TYPE BREAKDOWN
   ========================================================= */

function renderTypeChart(data) {
    const canvas = document.getElementById("type-chart");

    if (!canvas) {
        return;
    }

    const requests = data.requests || [];

    const typeCounts = {
        HTML: 0,
        CSS: 0,
        JavaScript: 0,
        Images: 0,
        Fonts: 0,
        API: 0,
        Other: 0
    };


    requests.forEach((request) => {
        const type = getRequestType(request.mimeType);

        typeCounts[type]++;
    });


    drawTypeChart(canvas, typeCounts);
}


/*
 * Convert MIME type into a human-readable category.
 */

function getRequestType(mimeType) {
    const type = (mimeType || "").toLowerCase();

    if (type.includes("text/html")) {
        return "HTML";
    }

    if (type.includes("text/css")) {
        return "CSS";
    }

    if (
        type.includes("javascript") ||
        type.includes("ecmascript")
    ) {
        return "JavaScript";
    }

    if (type.startsWith("image/")) {
        return "Images";
    }

    if (
        type.includes("font/") ||
        type.includes("woff") ||
        type.includes("ttf") ||
        type.includes("opentype")
    ) {
        return "Fonts";
    }

    if (
        type.includes("json") ||
        type.includes("xml") ||
        type.includes("graphql")
    ) {
        return "API";
    }

    return "Other";
}


/*
 * Draw a simple horizontal bar chart.
 *
 * No external chart library is needed.
 */

function drawTypeChart(canvas, typeCounts) {
    const context = canvas.getContext("2d");

    if (!context) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);

    const entries = Object.entries(typeCounts)
        .filter(([, count]) => count > 0);

    if (entries.length === 0) {
        context.font = "16px sans-serif";
        context.fillText("No request data available.", 20, 40);
        return;
    }

    const maxCount = Math.max(
        ...entries.map(([, count]) => count)
    );

    const labelWidth = 110;
    const chartWidth = width - labelWidth - 40;

    const rowHeight = 42;
    const barHeight = 22;

    entries.forEach(([type, count], index) => {
        const y = 25 + index * rowHeight;

        /*
         * Label
         */

        context.fillStyle = "#18201d";
        context.font = "14px sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";

        context.fillText(
            type,
            10,
            y
        );


        /*
         * Background bar
         */

        context.fillStyle = "#e2e6df";

        context.fillRect(
            labelWidth,
            y - barHeight / 2,
            chartWidth,
            barHeight
        );


        /*
         * Value bar
         */

        context.fillStyle = "#657818";

        const barWidth =
            (count / maxCount) * chartWidth;

        context.fillRect(
            labelWidth,
            y - barHeight / 2,
            barWidth,
            barHeight
        );


        /*
         * Count
         */

        context.fillStyle = "#18201d";
        context.font = "bold 14px sans-serif";
        context.textAlign = "left";

        context.fillText(
            count,
            labelWidth + chartWidth + 10,
            y
        );
    });
}


/* =========================================================
   EMPTY REPORT
   ========================================================= */

function showEmptyReport() {
    const filenameElement = document.getElementById(
        "report-filename"
    );

    if (filenameElement) {
        filenameElement.textContent =
            "No file analyzed yet. Upload a HAR file first.";
    }

    const summaryCards = document.getElementById(
        "summary-cards"
    );

    if (summaryCards) {
        summaryCards.innerHTML = `
            <article class="summary-card">
                <span class="summary-card__label">
                    STATUS
                </span>

                <strong class="summary-card__value">
                    —
                </strong>

                <span class="summary-card__detail">
                    No analysis available
                </span>
            </article>
        `;
    }
}


/* =========================================================
   FORMATTING HELPERS
   ========================================================= */

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function formatTime(milliseconds) {
    if (!Number.isFinite(milliseconds)) {
        return "0 ms";
    }

    if (milliseconds < 1000) {
        return `${milliseconds.toFixed(0)} ms`;
    }

    return `${(milliseconds / 1000).toFixed(2)} s`;
}