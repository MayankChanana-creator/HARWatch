const HISTORY_KEY = "harwatch-history";
const MAX_HISTORY_ITEMS = 10;

function saveAnalysisToHistory(report){
    if(!report){
        return;
    }
    try{
        const history = getAnalysisHistory();
        const historyItem = {
            id: Date.now(),
            filename: report.filename || "Unknown file",
            timestamp: new Date().toISOString(),
            summary: report.analysis?.summary || null,
            totalRequests: report.data?.requests?.length || 0
        };
        history.unshift(historyItem);
        const limitedHistory = history.slice(0,MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY,JSON.stringify(limitedHistory));
    }
    catch(error){
        console.error("Could not save analysis history:",error);
    }
}

function getAnalysisHistory(){
    try{
        const stored = localStorage.getItem(HISTORY_KEY);
        if(!stored){
            return [];
        }
        const history = JSON.parse(stored);
        if(!Array.isArray(history)){
            return [];
        }
        return history;

    }
    catch(error){
        console.error("Could not read analysis history:",error);
        return [];
    }
}

function clearAnalysisHistory(){
    localStorage.removeItem(HISTORY_KEY);
}

window.saveAnalysisToHistory = saveAnalysisToHistory;
window.getAnalysisHistory = getAnalysisHistory;
window.clearAnalysisHistory = clearAnalysisHistory;