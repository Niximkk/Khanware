// Not fully secure, but at least it's not stored as plaintext.

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