self.onmessage = function (event){
    try{
        const har = event.data.har;
        if (!har || typeof har !== "object" || Array.isArray(har)){
            throw new Error("The file does not contain a valid HAR object.");
        }
        if(!har.log || typeof har.log !== "object"){
            throw new Error("Invalid HAR file: missing 'log' object.");
        }
        if(!Array.isArray(har.log.entries)){
            throw new Error("Invalid HAR file: 'log.entries' must be an array.");
        }
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
                    time:entry.time || 0,
                    timings:{
                        blocked:timing.blocked || 0,
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
            }
        );
        const parsedData = {
            version: har.log.version || "",
            creator: har.log.creator || {},
            requests: requests
        };
        self.postMessage({
            success: true,
            data: parsedData
        });

    }
    catch(error){
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};