// Big shout out to Fortress937 for the help!!
// Context: /issues/59

const originalFetch = window.fetch;

let antiCheatActive = false;

window.fetch = async function (input, init) {
    let body;
    if (input instanceof Request) body = await input.clone().text();
    else if (init && init.body) body = init.body;
    
    if (features.videoSpoof && body && body.includes('"operationName":"updateUserVideoProgress"')) {
        if (antiCheatActive) {
            debug(`⏸️ Em cooldown - Request passando sem modificação`);
            return originalFetch.apply(this, arguments);
        }
        
        try {
            let bodyObj = JSON.parse(body);
            if (bodyObj.variables && bodyObj.variables.input) {
                const durationSeconds = bodyObj.variables.input.durationSeconds;
                
                const activateCooldown = () => {
                    antiCheatActive = true;
                    debug(`🛑 30s cooldown active`);
                    sendToast("⚠️ Anti-cheat detectado!", 3000);
                    sendToast("⏳ Aguarde 30 segundos nessa atividade", 3000);
                    setTimeout(() => {
                        antiCheatActive = false;
                        debug(`✅ Cooldown finished - Exploit available again`);
                    }, 30000);
                };
                
                if (durationSeconds < 600) {
                    debug(`📹 Short video detected (${durationSeconds}s) - Going straight to 100%`);
                    
                    bodyObj.variables.input.secondsWatched = durationSeconds;
                    bodyObj.variables.input.lastSecondWatched = durationSeconds;
                    
                    let modifiedBody = JSON.stringify(bodyObj);
                    let lastResponse;
                    
                    if (input instanceof Request) {
                        lastResponse = await originalFetch.call(this, new Request(input, { body: modifiedBody }), init);
                    } else {
                        lastResponse = await originalFetch.call(this, input, { ...init, body: modifiedBody });
                    }
                    
                    debug(`✅ Video marked as 100% - Status: ${lastResponse.status}`);
                    
                    const responseClone = lastResponse.clone();
                    const responseData = await responseClone.json();
                    
                    if (responseData.data?.updateUserVideoProgress?.error?.code === "CHEATING") {
                        debug(`⚠️ Anti-cheat detected.`);
                        activateCooldown();
                    } else {
                        sendToast("🔓 Vídeo exploitado.", 2000);
                    }
                    
                    return lastResponse;
                    
                } else {
                    const percentages = [0.25, 0.50, 0.75, 1.0];
                    
                    debug(`📹 Starting video exploit - Total duration: ${durationSeconds}s`);
                    
                    let lastResponse;
                    
                    for (let i = 0; i < percentages.length; i++) {
                        const watchedSeconds = Math.floor(durationSeconds * percentages[i]);
                        const percentLabel = (percentages[i] * 100).toFixed(0);
                        
                        debug(`⏩ Stage ${i + 1}/4 - Sending ${percentLabel}% (${watchedSeconds}s)`);
                        
                        let modifiedBodyObj = JSON.parse(JSON.stringify(bodyObj));
                        modifiedBodyObj.variables.input.secondsWatched = watchedSeconds;
                        modifiedBodyObj.variables.input.lastSecondWatched = watchedSeconds;
                        
                        let modifiedBody = JSON.stringify(modifiedBodyObj);
                        
                        if (input instanceof Request) {
                            lastResponse = await originalFetch.call(this, new Request(input, { body: modifiedBody }), init);
                        } else {
                            lastResponse = await originalFetch.call(this, input, { ...init, body: modifiedBody });
                        }
                        
                        debug(`✅ Stage ${i + 1}/4 completed - Status: ${lastResponse.status}`);
                        
                        const responseClone = lastResponse.clone();
                        const responseData = await responseClone.json();
                        
                        if (responseData.data?.updateUserVideoProgress?.error?.code === "CHEATING") {
                            debug(`⚠️ Anti-cheat detected on stage ${i + 1}/4`);
                            activateCooldown();
                            break;
                        }
                        
                        if (i < percentages.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    
                    if (!antiCheatActive) {
                        debug(`🎉 Exploit complete! Video marked as 100% watched.`);
                        sendToast("🔓 Video exploitado.", 2000);
                    }
                    
                    return lastResponse;
                }
            }
        } catch (e) { debug(`🚨 Error @ videoSpoof.js\n${e}`); }
    }
    
    return originalFetch.apply(this, arguments);
};