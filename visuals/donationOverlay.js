const pixieContainer = document.createElement('div');
pixieContainer.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;width:min(400px,95vw);overflow:hidden;background:transparent';

const qrContainer = document.createElement('div');
qrContainer.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;height:225px;overflow:hidden;background:transparent';

const donateIframe = document.createElement('iframe');
donateIframe.src = 'https://widget.pixie.gg/alert/3fc05b7e-843b-4f58-900b-a62f566f022b';
donateIframe.style.cssText = 'width:800px;height:400px;border:none;transform:scale(0.5);transform-origin:top left;background:transparent;color-scheme:norma !important';
donateIframe.allowTransparency = true;
donateIframe.allow = 'autoplay; encrypted-media';

const qrIframe = document.createElement('iframe');
qrIframe.src = 'https://widget.pixie.gg/qr/3fc05b7e-843b-4f58-900b-a62f566f022b';
qrIframe.style.cssText = 'width:400px;height:600px;border:none;transform:scale(0.375);transform-origin:top right;background:transparent;color-scheme:norma !important';
qrIframe.allowTransparency = true;

pixieContainer.appendChild(donateIframe);
document.body.appendChild(pixieContainer);

if(!device.mobile){
    qrContainer.appendChild(qrIframe);
    document.body.appendChild(qrContainer);
}
