plppdo.on('domChanged', () => {
    if (document.getElementById('khanwareTab')) return;

    const nav = document.querySelector('nav[data-testid="side-nav"]'); 
    if (!nav) return;

    KWSection = document.createElement('section');
    KWSection.id = 'khanwareTab';
    KWSection.className = '_evg4u4';
    KWSection.innerHTML = '<h2 class="_n0asy6j">Khanware</h2>';

    nav.appendChild(KWSection);
});