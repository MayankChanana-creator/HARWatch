document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("drop-zone");
    if(dropZone){
        initializeUploadPage();
    }
    const summaryCards = document.getElementById("summary-cards");
    if(summaryCards){
        initializeReportPage();
    }
    renderAnalysisHistory();
});

let currentRequests = [];
function initializeUploadPage() {
    const dropZone = document.getElementById("drop-zone");
    const browseButton = document.getElementById("browse-btn");
    const fileInput = document.getElementById("file-input");
    const errorBox = document.getElementById("upload-error");

    if(!dropZone || !browseButton || !fileInput || !errorBox){
        return;
    }
    browseButton.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if(file){
            handleFile(file);
        }
    });
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.classList.add("dragging");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
    });

    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();

        dropZone.classList.remove("dragging");

        const file = event.dataTransfer.files[0];

        if(file){
            handleFile(file);
        }
    });

    async function handleFile(file) {
        clearError();

        if(!file.name.toLowerCase().endsWith(".har")){
            showError("Please select a .har file.");
            return;
        }

        try{
            setLoading(true);
            const har = await window.readHarFile(file);
            const parsedData = await parseHARWithWorker(har);
            const analysis = window.analyzeHar(parsedData);
            console.log("Raw HAR:", har);
            console.log("Parsed HAR:", parsedData);
            console.log("Analysis:", analysis);
            currentRequests = parsedData.requests;
            renderIssues(analysis.findings);
            renderRequests(sortRequests(currentRequests));
            setupRequestControls();
            const reportData = {
                filename: file.name,
                data: parsedData,
                analysis : analysis
            };
            sessionStorage.setItem(
                "harwatch-report",
                JSON.stringify(reportData)
            );
            saveAnalysisToHistory(reportData);
            showSuccess(file, parsedData);

        } 
        catch(error){
            showError(error.message);
        } 
        finally{
            setLoading(false);
        }
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
    }

    function clearError() {
        errorBox.textContent = "";
        errorBox.hidden = true;
    }

    function setLoading(isLoading){
        if(isLoading){
            browseButton.disabled = true;
            browseButton.textContent = "Reading...";
        } 
        else{
            browseButton.disabled = false;
            browseButton.textContent = "Browse files";
        }
    }

    function showSuccess(file, parsedData){
        console.log("File name:", file.name);
        console.log("HAR version:", parsedData.version);
        console.log("Number of requests:", parsedData.requests.length);
        errorBox.textContent =
            `Valid HAR file loaded: ${file.name} ` +
            `(${parsedData.requests.length} requests)`;
        errorBox.hidden = false;
    }
}

function initializeReportPage() {
    const storedReport = sessionStorage.getItem("harwatch-report");
    if(!storedReport){
        showEmptyReport();
        return;
    }

    try{
        const report = JSON.parse(storedReport);
        renderReport(report);

    } 
    catch(error){
        console.error("Could not load report:", error);
        showEmptyReport();
    }
}

function renderReport(report) {
    const filenameElement = document.getElementById("report-filename");

    if (filenameElement) {
        filenameElement.textContent = report.filename;
    }

    const data = report.data;

    renderSummaryCards(data);
    renderTypeChart(data);

    renderIssues(report.analysis?.findings || []);
    currentRequests = data.requests || [];

    renderRequests(
        sortRequests(currentRequests)
    );

    setupRequestControls();
}

function renderSummaryCards(data) {
    const container = document.getElementById("summary-cards");

    if(!container){
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

function renderTypeChart(data) {
    const canvas = document.getElementById("type-chart");

    if(!canvas){
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

function getRequestType(mimeType) {
    const type = (mimeType || "").toLowerCase();

    if(type.includes("text/html")){
        return "HTML";
    }

    if(type.includes("text/css")){
        return "CSS";
    }
    if(type.includes("javascript") || type.includes("ecmascript")){
        return "JavaScript";
    }
    if(type.startsWith("image/")){
        return "Images";
    }
    if(type.includes("font/") || type.includes("woff") || type.includes("ttf") || type.includes("opentype")){
        return "Fonts";
    }

    if(type.includes("json") || type.includes("xml") || type.includes("graphql")){
        return "API";
    }
    return "Other";
}

function drawTypeChart(canvas, typeCounts) {
    const context = canvas.getContext("2d");
    if(!context){
        return;
    }
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const entries = Object.entries(typeCounts).filter(([, count]) => count > 0);
    if(entries.length === 0){
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
        context.fillStyle = "#18201d";
        context.font = "14px sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(type,10,y);
        context.fillStyle = "#e2e6df";
        context.fillRect(
            labelWidth,
            y - barHeight / 2,
            chartWidth,
            barHeight
        );
        context.fillStyle = "#657818";
        const barWidth = (count / maxCount) * chartWidth;
        context.fillRect(
            labelWidth,
            y - barHeight / 2,
            barWidth,
            barHeight
        );
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

function showEmptyReport() {
    const filenameElement = document.getElementById("report-filename");
    if(filenameElement){
        filenameElement.textContent = "No file analyzed yet. Upload a HAR file first.";
    }

    const summaryCards = document.getElementById("summary-cards");
    if(summaryCards){
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

function formatBytes(bytes){
    if(!Number.isFinite(bytes) || bytes <= 0){
        return "0 B";
    }

    if(bytes < 1024){
        return `${bytes} B`;
    }

    if(bytes < 1024 * 1024){
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatTime(milliseconds) {
    if(!Number.isFinite(milliseconds)){
        return "0 ms";
    }

    if(milliseconds < 1000){
        return `${milliseconds.toFixed(0)} ms`;
    }
    return `${(milliseconds / 1000).toFixed(2)} s`;
}

function renderIssues(findings){
    const issuesList  = document.getElementById("issues-list");
    if(!issuesList){
        return;
    }
    issuesList.innerHTML = "";
    if(!findings || findings.length === 0){
        const emptyItem = document.createElement("li");
        emptyItem.className = "issue issue--empty";
        emptyItem.textContent = "No performance issues were detected.";
        issuesList.appendChild(emptyItem);
        return;
    }

    const severityOrder = {
        high : 1,
        medium : 2,
        low : 3
    };
    const sortedFindings = [...findings].sort(
        (a,b) => {
            return ((severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));
        }
    );
    sortedFindings.forEach((finding) => {
        const item = document.createElement("li");
        item.className = `issue issue--${finding.severity}`;
         item.innerHTML = `
            <div class="issue__header">

                <span class="issue__severity">
                    ${escapeHtml(
                        finding.severity.toUpperCase()
                    )}
                </span>

                <strong class="issue__title">
                    ${escapeHtml(
                        finding.title
                    )}
                </strong>

            </div>

            <p class="issue__message">
                ${escapeHtml(
                    finding.message
                )}
            </p>

            <p class="issue__url">
                ${escapeHtml(
                    finding.url
                )}
            </p>

            ${
                finding.fix
                    ? `
                    <p class="issue__fix">
                        Fix: ${escapeHtml(
                            finding.fix
                        )}
                    </p>
                    `
                    : ""
            }
        `;
        issuesList.appendChild(item);
    });
}

function escapeHtml(value){
    return String(value ?? "")
    .replace(/&/g, "&amp")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRequests(requests){
    const table = document.getElementById("requests-table");
    if(!table){
        return;
    }
    const tbody = table.querySelector("tbody");
    if(!tbody){
        return;
    }
    tbody.innerHTML = "";
    if(!requests || requests.length === 0){
        const row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="5">
            No requests found.
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    requests.forEach((request) => {
        const row = document.createElement("tr");
        const status = Number(request.status) || 0;
        const size = Number(request.responseSize) || 0;
        const time = Number(request.time) || 0;
        row.innerHTML = `
            <td
                class="request-url"
                title="${escapeHtml(request.url)}"
            >
                ${escapeHtml(request.url)}
            </td>

            <td>
                <span class="status status--${getStatusClass(status)}">
                    ${status}
                </span>
            </td>

            <td>
                ${escapeHtml(request.mimeType || "Unknown")}
            </td>

            <td>
                ${formatBytes(size)}
            </td>

            <td>
                ${time.toFixed(0)} ms
            </td>
        `;

        tbody.appendChild(row);
    });
}
function getStatusClass(status){
    if(status >= 500){
        return "error";
    }
    if(status >= 400){
        return "warning";
    }
    if(status >= 300){
        return "redirect";
    }
    if(status >= 200){
        return "success";
    }
    return "unknown";
}
function filterRequests(){
    const searchInput = document.getElementById("request-search");
    if(!searchInput){
        return;
    }
    const query = searchInput.value.trim().toLowerCase();
    const filtered = currentRequests.filter(
        (request) => {
            return request.url.toLowerCase().includes(query);
        }
    );
    renderRequests(sortRequests(filtered));
}

function sortRequests(requests){
    const sortSelect = document.getElementById("request-sort");
    if(!sortSelect){
        return [...requests];
    }
    const sorted = [...requests];
    switch(sortSelect.value){
        case "time-desc":
            sorted.sort(
                (a,b) => (Number(b.time) || 0) - (Number(a.time) || 0)
            );
            break;
        case "size-desc":
            sorted.sort(
                (a,b) => 
                    (Number(b.responseSize) || 0) - (Number(a.responseSize) || 0)
            );
            break;
        case "status":
            sorted.sort(
                (a,b) => 
                (Number(a.status) || 0) - (Number(b.status) || 0)
            );
            break;
    }
    return sorted;
}

function setupRequestControls(){
    const searchInput = document.getElementById("request-search");
    const sortSelect = document.getElementById("request-sort");
    if(searchInput){
        searchInput.addEventListener("input",filterRequests);
    }
    if(sortSelect){
        sortSelect.addEventListener("change",() => {
            renderRequests(sortRequests(currentRequests));
        });
    }
}


function renderWaterfall(report){

    const waterfall = document.getElementById("waterfall");
    const emptyState = document.getElementById("waterfall-empty");
    const rowsContainer = document.getElementById("waterfall-rows");
    const scaleContainer = document.getElementById("waterfall-scale");
    const filenameElement = document.getElementById("waterfall-filename");

    if(!waterfall || !rowsContainer){
        return;
    }

    if(!report || !report.data || !Array.isArray(report.data.requests)){

        waterfall.hidden = true;

        if(emptyState){
            emptyState.hidden = false;
        }
        return;
    }

    const requests = report.data.requests;

    if(filenameElement){
        filenameElement.textContent = report.filename || "HAR analysis";
    }
    if(requests.length === 0){
        waterfall.hidden = true;
        if(emptyState){
            emptyState.hidden = false;
            emptyState.textContent = "No requests were found in this HAR file.";
        }
        return;
    }

    if(emptyState){
        emptyState.hidden = true;
    }
    waterfall.hidden = false;
    renderWaterfallRows(requests,rowsContainer,scaleContainer);
}
function renderWaterfallRows(requests,rowsContainer,scaleContainer){
    const sortedRequests = sortWaterfallRequests(requests);
    rowsContainer.innerHTML = "";
    const startTimes = sortedRequests.map(request => new Date(request.startedDateTime).getTime()).filter(Number.isFinite);

    const earliestStart = startTimes.length
        ? Math.min(...startTimes)
        : 0;
    const timelineEnd = sortedRequests.reduce(
        (maximum, request) => {

            const start = getRequestStartOffset(
                request,
                earliestStart
            );

            const duration = Number(request.time) || 0;

            return Math.max(
                maximum,
                start + duration
            );

        },
        0
    );

    const totalDuration = Math.max(timelineEnd,1);

    renderWaterfallScale(scaleContainer,totalDuration);
    sortedRequests.forEach((request, index) => {
        const row = createWaterfallRow(
            request,
            index,
            earliestStart,
            totalDuration
        );
        rowsContainer.appendChild(row);
    });
}
function createWaterfallRow(request,index,earliestStart,totalDuration){
    const row = document.createElement("div");
    row.className = "waterfall__row";
    const label = document.createElement("div");
    label.className = "waterfall__label";
    const url = request.url || "Unknown request";
    label.innerHTML = `
        <span
            class="waterfall__method">
            ${escapeHtml(request.method || "GET")}
        </span>

        <span
            class="waterfall__url"
            title="${escapeHtml(url)}">
            ${escapeHtml(getDisplayUrl(url))}
        </span>
    `;
    const timeline = document.createElement("div");
    timeline.className = "waterfall__timeline waterfall__timeline--row";
    const startOffset = getRequestStartOffset(request,earliestStart);
    const duration = Math.max(Number(request.time) || 0,0);
    const left = (startOffset / totalDuration) * 100;
    const width = Math.max((duration / totalDuration) * 100,0.4);
    const bar = document.createElement("div");
    bar.className = "waterfall__bar";
    bar.style.left = `${left}%`;
    bar.style.width = `${width}%`;
    const phases = getTimingPhases(request);
    phases.forEach(phase => {
        if(phase.duration <= 0){
            return;
        }
        const phaseElement = document.createElement("span");
        phaseElement.className = `waterfall__phase waterfall__phase--${phase.name}`;

        phaseElement.style.width = `${(phase.duration / duration) * 100}%`;

        phaseElement.title = `${formatPhaseName(phase.name)}: ${phase.duration.toFixed(1)} ms`;
        bar.appendChild(phaseElement);
    });

    const durationLabel = document.createElement("span");

    durationLabel.className = "waterfall__duration";

    durationLabel.textContent = `${duration.toFixed(0)} ms`;

    bar.appendChild(durationLabel);
    timeline.appendChild(bar);
    row.appendChild(label);
    row.appendChild(timeline);
    return row;
}

function getTimingPhases(request) {
    const timings = request.timings || {};

    return[
        {
            name: "blocked",
            duration: positiveNumber(timings.blocked)
        },
        {
            name: "dns",
            duration: positiveNumber(timings.dns)
        },
        {
            name: "connect",
            duration: positiveNumber(timings.connect)
        },
        {
            name: "send",
            duration: positiveNumber(timings.send)
        },
        {
            name: "wait",
            duration: positiveNumber(timings.wait)
        },
        {
            name: "receive",
            duration: positiveNumber(timings.receive)
        }
    ];
}


function positiveNumber(value) {

    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return 0;
    }

    return number;
}


function getRequestStartOffset(request,earliestStart){
    const start = new Date(request.startedDateTime).getTime();
    if(!Number.isFinite(start)){
        return 0;
    }

    return Math.max(start - earliestStart,0);
}


function renderWaterfallScale(scaleContainer,totalDuration){
    if(!scaleContainer){
        return;
    }
    scaleContainer.innerHTML = "";
    const points = 5;
    for(let i = 0; i <= points; i++){
        const marker = document.createElement("span");
        marker.className = "waterfall__scale-marker";
        const position = (i / points) * 100;
        marker.style.left = `${position}%`;

        const time = (totalDuration * i) / points;

        marker.textContent = formatMilliseconds(time);

        scaleContainer.appendChild(marker);
    }
}


function formatMilliseconds(value){

    if(value < 1000){
        return `${value.toFixed(0)} ms`;
    }

    return `${(value / 1000).toFixed(2)} s`;
}


function formatPhaseName(name){

    const names = {
        blocked: "Blocked",
        dns: "DNS",
        connect: "Connect",
        send: "Send",
        wait: "Wait / TTFB",
        receive: "Receive"
    };

    return names[name] || name;
}


function getDisplayUrl(url){

    try{

        const parsed = new URL(url);
        return parsed.pathname + parsed.search;
    } 
    catch{
        return url;

    }
}


function sortWaterfallRequests(requests){

    const select = document.getElementById("waterfall-sort");

    const sorted = [...requests];

    if(!select){
        return sorted;
    }

    switch(select.value){

        case "duration":
            sorted.sort(
                (a, b) =>
                    (Number(b.time) || 0) -
                    (Number(a.time) || 0)
            );

            break;


        case "size":

            sorted.sort(
                (a, b) =>
                    (Number(b.responseSize) || 0) -
                    (Number(a.responseSize) || 0)
            );

            break;


        case "start":

        default:

            sorted.sort(
                (a, b) =>
                    new Date(a.startedDateTime).getTime() -
                    new Date(b.startedDateTime).getTime()
            );

            break;
    }

    return sorted;
}


function setupWaterfallControls(){

    const select = document.getElementById("waterfall-sort");

    if(!select){
        return;
    }

    select.addEventListener(
        "change",
        () => {

            const report =
                getStoredReport();

            if (report) {
                renderWaterfall(report);
            }

        }
    );
}


function getStoredReport(){
    try{

        const stored = sessionStorage.getItem("harwatch-report");
        if (!stored) {
            return null;
        }
        return JSON.parse(stored);

    }
    catch(error){

        console.error("Could not load stored HAR report:",error);
        return null;
    }
}


document.addEventListener("DOMContentLoaded",() => {
        const waterfallPage = document.getElementById("waterfall");

        if(!waterfallPage){
            return;
        }

        const report = getStoredReport();

        renderWaterfall(report);

        setupWaterfallControls();

    }
);

function parseHARWithWorker(har){
    return new Promise((resolve,reject) => {
        const worker = new Worker("./js/worker.js");
        worker.onmessage = function(event){
            const result = event.data;
            worker.terminate();
            if(!result.success){
                reject(new Error(result.error));
                return;
            }
            resolve(result.data);
        };
        worker.onerror = function(error) {
            worker.terminate();
            reject(new Error("HAR processing failed in Web Worker"));
        };
        worker.postMessage({har : har});
    });
}

function renderAnalysisHistory(){
    const historyList = document.getElementById("history-list");
    if(!historyList){
        return;
    }
    const history = getAnalysisHistory();
    historyList.innerHTML = "";
    if (history.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "text-muted";
        emptyItem.textContent = "No saved analyses yet.";
        historyList.appendChild(emptyItem);
        return;
    }

    history.forEach(item => {
        const listItem = document.createElement("li");
        listItem.className = "history-item";
        const date = new Date(item.timestamp);
        listItem.innerHTML = `
            <div class="history-item__main">
                <strong>
                    ${escapeHtml(item.filename)}
                </strong>
                <span class="history-item__date">
                    ${formatHistoryDate(date)}
                </span>
            </div>
            <div class="history-item__meta">
                <span>
                    ${item.totalRequests} requests
                </span>
                <span>
                    ${item.summary?.totalFindings || 0} issues
                </span>
            </div>
        `;
        historyList.appendChild(listItem);
    });
}

function formatHistoryDate(date){
    if(!(date instanceof Date) || Number.isNaN(date.getTime())){
        return "Unknown date";
    }
    return date.toLocaleString(undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}