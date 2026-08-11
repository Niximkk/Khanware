/* Emmiter */
class EventEmitter{constructor(){this.events={}}on(t,e){"string"==typeof t&&(t=[t]),t.forEach(t=>{this.events[t]||(this.events[t]=[]),this.events[t].push(e)})}off(t,e){"string"==typeof t&&(t=[t]),t.forEach(t=>{this.events[t]&&(this.events[t]=this.events[t].filter(t=>t!==e))})}emit(t,...e){this.events[t]&&this.events[t].forEach(t=>{t(...e)})}once(t,e){"string"==typeof t&&(t=[t]);let s=(...i)=>{e(...i),this.off(t,s)};this.on(t,s)}};
const plppdo = new EventEmitter();
new MutationObserver((mutationsList) => { for (let mutation of mutationsList) if (mutation.type === 'childList') plppdo.emit('domChanged'); }).observe(document.body, { childList: true, subtree: true });

/* Dev */
function debug(message) {
    if (!window.khanwareWin || window.khanwareWin.closed || !window.debugMode) return;
    
    const debugBox = window.khanwareWin.document.getElementById('debugBox');
    if (debugBox) {
        debugBox.innerHTML += message + '\n';
        debugBox.scrollTop = debugBox.scrollHeight;
    }
};
function createTab(name, href = '#', id) { 
    const li = document.createElement('li'); 
    li.innerHTML = `<a class="_1fk4n79o" id="${id}" href="${href}" target="_blank"><span class="_i7xxeac">${name}</span></a>`; 
    return li; 
}

/* API Key Store */
async function getKey(uid) {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(uid)));
    return crypto.subtle.importKey( "raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"] );
}
async function saveApiKey(apiKey, uid) {
    const key = await getKey(uid);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt( { name: "AES-GCM", iv }, key, new TextEncoder().encode(apiKey) );

    sendToast(`🔐 ${t('api_stored')}`);
    
    localStorage.setItem("KWOpenRouterKey", JSON.stringify({ iv: [...iv], data: [...new Uint8Array(encrypted)] }));
}
async function getApiKey(uid) {
    const saved = JSON.parse(localStorage.getItem("KWOpenRouterKey"));
    if (!saved) return;

    const key = await getKey(uid);

    try {
        const decrypted = await crypto.subtle.decrypt( { name: "AES-GCM", iv: new Uint8Array(saved.iv) }, key, new Uint8Array(saved.data) );

        featureConfigs.openRouterKey = new TextDecoder().decode(decrypted);

        sendToast(`🔑 ${t('api_restored')}`);
    } catch { return; }
}

window.plppdo = plppdo;

window.initializeRepoPath = initializeRepoPath;

window.debug = debug;
window.createTab = createTab;

window.getApiKey = getApiKey;
window.saveApiKey = saveApiKey;
window.getKey = getKey;