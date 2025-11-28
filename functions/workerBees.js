/* Yes, OG Khanware goes brrrrr */

const beeSounds = [
    'https://minecraft.wiki/images/transcoded/Bee_pollinate1.ogg/Bee_pollinate1.ogg.mp3',
    'https://minecraft.wiki/images/transcoded/Bee_pollinate2.ogg/Bee_pollinate2.ogg.mp3',
    'https://minecraft.wiki/images/transcoded/Bee_pollinate3.ogg/Bee_pollinate3.ogg.mp3',
    'https://minecraft.wiki/images/transcoded/Bee_pollinate4.ogg/Bee_pollinate4.ogg.mp3'
];

plppdo.on('domChanged', () => {
    const links = document.querySelectorAll('._akhdlgo');
    if (features.workerBees){
        links.forEach((link, index) => {

        if (link.dataset.processed) return;
        link.dataset.processed = 'true';

        link.addEventListener('click', function(e) {
            e.preventDefault();

            if (this.classList.contains('bee-executing')) {
                sendToast('🐝 Aguarde finalizar!');
                return;
            }

            this.classList.add('bee-executing');

            playAudio(beeSounds[Math.floor(Math.random() * beeSounds.length)]);
            sendToast(`🐝 Executando a ${index + 1}° atividade.`);

            const indicatorDiv = this.getElementsByTagName('div')[0];
            indicatorDiv.style.transition = 'opacity 0.5s ease-in-out';

            const pulseInterval = setInterval(() => {
                indicatorDiv.style.opacity = indicatorDiv.style.opacity === '0.3' ? '1' : '0.3';
            }, 750);

            const cleanup = () => {
                clearInterval(pulseInterval);
                indicatorDiv.style.opacity = '1';
                this.classList.remove('bee-executing');
            };
            
            const iframeId = `bee-iframe-${Date.now()}`;
            const iframe = document.createElement('iframe');
            Object.assign(iframe.style, {
                display: 'none',
                position: 'absolute',
                width: '0',
                height: '0',
                border: 'none',
                height: '10vh'
            });
            iframe.id = iframeId;
            iframe.src = this.href;
                            
            iframe.onload = async function() {
                try {
                    const response = await fetch(repoPath+'utils/beeScript.js');

                    if (!response.ok) {
                        sendToast('🐝 Tive problemas ao acessar o script.');
                        beeScript = 'window.frameElement?.remove();';
                    }

                    const beeScript = await response.text();

                    const script = iframe.contentWindow.document.createElement('script');
                    script.textContent = beeScript;
                    iframe.contentWindow.document.body.appendChild(script);
                } catch (e) { };
            };

            document.body.appendChild(iframe);

            let resolved = false;
            plppdo.on('domChanged', () => {
                if(!resolved&&!document.getElementById(iframeId)){
                    cleanup();
                    sendToast('🐝 Atividade concluida!');
                    playAudio('https://minecraft.wiki/images/transcoded/Beehive_enter.ogg/Beehive_enter.ogg.mp3')
                    resolved = true;
                }
            });
        });
        });
    }
});