const visitorCounter = {
    config: {
        url: 'https://count.getloli.com/@:Khanware?name=%3AKhanware&theme=booru-lisu&padding=7&offset=0&align=center&scale=1&pixelated=0&darkmode=auto',
        container: 'position:fixed;top:10px;left:10px;z-index:9999;padding:5px;background:transparent;pointer-events:none',
        image: 'display:block;width:150px;height:auto'
    }
};

const createCounter = (config) => {
    const container = document.createElement('div');
    container.style.cssText = config.container;
    
    const img = document.createElement('img');
    img.src = config.url;
    img.alt = 'Contador de visitas';
    img.style.cssText = config.image;
    
    container.appendChild(img);
    return container;
};

if (!device.mobile) {
    const counterContainer = createCounter(visitorCounter.config);
    document.body.appendChild(counterContainer);
}