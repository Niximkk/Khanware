plppdo.on('domChanged', () => {
    if (document.getElementById('devSettings')) return;

    const ul = document.createElement('ul');
    const devTab = createTab('Developer', '#', 'devSettings');
    
    devTab.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        window.khanwareWin = window.open("", "_blank");
        if (window.khanwareWin) {
            window.khanwareWin.document.write(`
                <html>
                <head>
                    <title>Khanware Developer</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            background: #121212; 
                            color: #fff; 
                            margin: 0; 
                        }
                        .container { 
                            width: min(90vw, 600px);
                            height: min(90vh, 600px);
                            padding: 20px; 
                            border-radius: 10px; 
                            background: #1e1e1e; 
                            box-shadow: 0px 0px 15px rgba(0,0,0,0.5); 
                            display: flex; 
                            flex-direction: column; 
                            justify-content: space-between;
                        }
                        h2 {
                            text-align: center;
                            margin-bottom: 10px;
                        }
                        .toggle-container {
                            flex: 1;
                            overflow-y: auto;
                            padding-right: 10px;
                        }
                        .toggle { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            padding: 10px; 
                            border-bottom: 1px solid #333; 
                        }
                        .toggle strong { color: #fff; }
                        .toggle small { color: #bbb; }
                        .debug-box { 
                            width: 90%;
                            height: 150px; 
                            overflow-y: auto; 
                            background: #000; 
                            color: #ccc; 
                            padding: 10px; 
                            font-family: monospace; 
                            white-space: pre-wrap; 
                            border-radius: 5px; 
                            border: 1px solid #333;
                            margin: 10px auto;
                        }
                        input[type="checkbox"] { 
                            transform: scale(1.2); 
                            cursor: pointer; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Developer Options</h2>
                        <div class="toggle-container" id="toggles"></div>
                        <div class="debug-box" id="debugBox"></div>
                    </div>
                    <script>
                        document.head.appendChild(Object.assign(document.createElement('style'), {
                            innerHTML: "::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1e1e1e; } ::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; } ::-webkit-scrollbar-thumb:hover { background: #666; }"
                        }));
                    </script>
                </body>
                </html>
            `);
        }
        createToggle(`${t('debug_mode')}`, `${t('debug_mode_desc')}`, 'debugMode', window.debugMode || false);
        createToggle(`${t('disable_security')}`, `${t('disable_security_desc')}`, 'disableSecurity', window.disableSecurity || false);
        createToggle(`${t('disable_ping')}`, `${t('disable_ping_desc')}`, 'disablePing', window.disablePing || false);
    });

    ul.appendChild(devTab);
    KWSection.appendChild(ul);
});

window.createToggle = function(name, desc, varName, toggled = false) {
    if (!window.khanwareWin || window.khanwareWin.closed) return;

    const toggleContainer = window.khanwareWin.document.getElementById('toggles');
    if (!toggleContainer) return;

    const toggleId = `toggle-${varName}`;

    const toggleElement = document.createElement('div');
    toggleElement.className = 'toggle';
    toggleElement.innerHTML = `
        <div>
            <strong>${name}</strong><br>
            <small>${desc}</small>
        </div>
        <input type="checkbox" id="${toggleId}" ${toggled ? "checked" : ""}>
    `;

    toggleElement.querySelector('input').addEventListener('change', (e) => {
        window[varName] = e.target.checked;
        debug(`❕${name} ${t('set_to')} ${window[varName]}`);
    });

    toggleContainer.appendChild(toggleElement);
};
window.debug = function(message) {
    if (!window.khanwareWin || window.khanwareWin.closed || !window.debugMode) return;
    
    const debugBox = window.khanwareWin.document.getElementById('debugBox');
    if (debugBox) {
        debugBox.innerHTML += message + '\n';
        debugBox.scrollTop = debugBox.scrollHeight;
    }
};
window.onerror = function(message, source, lineno, colno, error) { debug(`🚨 ${t('error_at')} ${source}:${lineno},${colno} \n${error ? error.stack : message}`); return true; };