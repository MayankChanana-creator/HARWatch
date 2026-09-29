# HARWatch

HARWatch is a browser-based web performance analyzer that lets you diagnose slow-loading websites by uploading a HAR (HTTP Archive) file exported from your browser's DevTools. Users upload a HAR file, HARWatch parses every network request it contains, runs a set of performance rules against the data, and produces a severity-ranked report with a visual timeline of exactly what happened during page load.

The current implementation is a lightweight frontend application built with vanilla HTML, CSS, and modern JavaScript. Analysis history and custom rules are stored locally in the browser using LocalStorage, so the application does not require a backend or database server to run.

## Features

- Upload and validate HAR files exported from Chrome, Edge, or Firefox DevTools
- Automatic detection of slow server responses (high time-to-first-byte)
- Detection of uncompressed assets, missing cache headers, and failed requests
- Severity-ranked findings (High / Medium / Low) with plain-language fix suggestions
- Visual waterfall view showing per-request timing and blocking behavior
- Create, edit, enable/disable, and delete custom detection rules
- Local analysis history with rename and delete support
- Export reports as JSON or CSV
- Web Worker-based parsing and analysis for large HAR files

## How HARWatch Works

The application follows a simple browser-based workflow:

1. A user uploads a HAR file (or loads the bundled sample).
2. HARWatch validates the file and reads it using the FileReader API.
3. The file is parsed and analyzed inside a Web Worker, so the interface stays responsive.
4. A set of rules is run against every request to flag performance issues.
5. Findings are ranked by severity and rendered on the report page.
6. A waterfall view visualizes the timing of every request on a timeline.
7. The analysis is automatically saved to local history.
8. The user can export the findings as a JSON or CSV file.

## Project Structure

```
harwatch/
├── data/
│   └── sample.har
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── parser.js
│   ├── rules.js
│   ├── analyzer.js
│   ├── worker.js
│   ├── waterfall.js
│   └── storage.js
├── index.html
├── report.html
├── waterfall.html
├── rules.html
└── README.md
```

## Main Components

- `index.html` — HAR upload page and entry point.
- `report.html` — findings summary, severity breakdown, and issues table.
- `waterfall.html` — request timing visualized as a timeline.
- `rules.html` — create, edit, and manage custom detection rules.
- `parser.js` — reads and validates HAR files, extracts request data.
- `rules.js` — rule definitions and CRUD logic for custom rules.
- `analyzer.js` — runs rules against parsed request data and assigns severity.
- `worker.js` — runs parsing and analysis in a Web Worker.
- `waterfall.js` — computes and renders timeline bar positions.
- `storage.js` — LocalStorage helpers for history, rules, and settings.

## Prerequisites

HARWatch is a static web application, so there is no Node.js backend, database server, or package installation required.

You need:

- A modern web browser with support for:
  - Web Workers
  - LocalStorage
  - FileReader / Blob APIs
- A local static HTTP server

A static HTTP server is recommended because Web Workers and some browser security policies can prevent the application from working correctly when opened directly with the `file://` protocol.

## Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd harwatch
   ```
   Replace `<repository-url>` with the URL of your HARWatch repository.

2. **Start a local HTTP server**

   If you have Python installed:
   ```bash
   python3 -m http.server 8000
   ```

3. **Open HARWatch**

   Open the following URL in your browser:
   ```
   http://localhost:8000
   ```

4. **Analyze a HAR file**

   From the HARWatch home page:
   - Click "Try sample HAR" to see a demo report instantly, or
   - Export your own: open any website, open DevTools (F12), go to the Network tab, reload the page, right-click a request, and choose "Save all as HAR with content".
   - Upload the HAR file on the home page.

5. **Review the results**

   On the report page:
   - View the severity-ranked list of issues with fix suggestions.
   - Filter and sort the full request table.
   - Open the waterfall view to see request timing visually.

6. **Manage rules and history**
   - Open `rules.html` to create, edit, or disable detection rules.
   - Past analyses are listed for quick access, and can be renamed or deleted.
   - Export any report as JSON or CSV from the report page.

## Data Storage

HARWatch currently uses the browser's LocalStorage API for local persistence.

The stored keys include:

- `harwatch_history` — saved analyses and their summaries
- `harwatch_rules` — user-created and modified detection rules
- `harwatch_settings` — threshold and preference settings

This means analysis history and rules are stored locally in the browser rather than on a remote server.

Clearing the browser's site data can remove locally stored HARWatch history and rules.

## Detection Rules

Detection rules are defined in `js/rules.js` as objects with a condition, severity, and fix suggestion.

The default rules cover:

- Slow server response (TTFB above threshold)
- Uncompressed text assets
- Missing cache headers on static files
- Failed requests (4xx/5xx status codes)
- High third-party request share

This design allows detection rules to be extended or adjusted from the Rules page without changing the analyzer's core logic.

## Analysis Model

HARWatch represents a HAR file as a flat list of request entries.

Conceptually:

```
HAR File
├── Entries
│   ├── Request (URL, method, headers)
│   ├── Response (status, headers, size)
│   └── Timings (blocked, dns, connect, wait, receive)
└── Findings
    ├── Rule Triggered
    ├── Severity
    └── Fix Suggestion
```

During analysis, each entry is checked against every enabled rule, and any triggered rule produces a finding containing:

- The affected request URL
- The rule that was triggered
- A severity level
- A plain-language fix suggestion

The analysis process runs inside a Web Worker so large HAR files do not block the main browser interface.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | UI styling and waterfall timeline presentation |
| Vanilla JavaScript | Application logic |
| LocalStorage | Local history, rules, and settings persistence |
| Web Workers | Background HAR parsing and analysis |
| Canvas API | Request-type breakdown chart |
| JSON | Sample data and export format |

## Current Scope

The current version focuses on analyzing a single HAR file at a time entirely in the browser.

It does not currently support live network capture, multi-page comparisons, or server-side processing of any kind.

The exported JSON/CSV report can serve as a starting point for sharing findings with a team or feeding into a future reporting pipeline.

## License

This project is licensed under the MIT License.

MIT permits users to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to the conditions of the license.

See the [LICENSE](./LICENSE) file for the complete license text.