const pixContainer = document.createElement('div');
pixContainer.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;width:min(400px,95vw);overflow:hidden;background:transparent;pointer-events:none';

const qrContainer = document.createElement('div');
qrContainer.style.cssText = 'position:fixed;bottom:60px;right:0px;z-index:9999;height:225px;overflow:hidden;background:transparent;pointer-events:none';

const donateIframe = document.createElement('iframe');
donateIframe.src = 'https://widget.livepix.gg/embed/3b6bbab3-3803-4575-a571-e203724de8af';
donateIframe.style.cssText = 'width:800px;height:400px;border:none;transform:scale(0.5);transform-origin:top left;background:transparent;color-scheme:normal !important;pointer-events:none';
donateIframe.allowTransparency = true;
donateIframe.allow = 'autoplay; encrypted-media';

const qrIframe = document.createElement('iframe');
qrIframe.src = 'https://widget.livepix.gg/embed/639dd918-b0d3-48d5-a1f4-dff124ce3117';
qrIframe.style.cssText = 'width:400px;height:600px;border:none;transform:scale(0.45);transform-origin:top right;background:transparent;color-scheme:normal !important;pointer-events:none';
qrIframe.allowTransparency = true;

pixContainer.appendChild(donateIframe);
document.body.appendChild(pixContainer);

if(!device.mobile){
    qrContainer.appendChild(qrIframe);
    document.body.appendChild(qrContainer);
}