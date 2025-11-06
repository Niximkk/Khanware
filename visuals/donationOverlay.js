const widgets = {
    donation: {
        id: '3b6bbab3-3803-4575-a571-e203724de8af',
        container: 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;width:min(400px,95vw);overflow:hidden;background:transparent;pointer-events:none',
        iframe: 'width:800px;height:400px;border:none;transform:scale(0.5);transform-origin:top left;background:transparent;color-scheme:normal !important;pointer-events:none'
    },
    qr: {
        id: '639dd918-b0d3-48d5-a1f4-dff124ce3117',
        container: 'position:fixed;bottom:60px;right:0px;z-index:9999;height:225px;overflow:hidden;background:transparent;pointer-events:none',
        iframe: 'width:400px;height:600px;border:none;transform:scale(0.45);transform-origin:top right;background:transparent;color-scheme:normal !important;pointer-events:none'
    }
};

const createWidget = (config) => {
    const container = document.createElement('div');
    container.style.cssText = config.container;
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://widget.livepix.gg/embed/${config.id}`;
    iframe.style.cssText = config.iframe;
    iframe.allowTransparency = true;
    iframe.allow = 'autoplay; encrypted-media';
    
    container.appendChild(iframe);
    return container;
};

const pixContainer = createWidget(widgets.donation);
document.body.appendChild(pixContainer);

let qrContainer;

if (!device.mobile) {
    qrContainer = createWidget(widgets.qr);
    document.body.appendChild(qrContainer);
}

plppdo.on('domChanged', () => {
    if (qrContainer) qrContainer.style.bottom = window.location.pathname.includes('/profile') ? '0px' : '60px';
});