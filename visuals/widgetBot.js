// Rest in piss wont be missed

if(!device.mobile) {
    const script = Object.assign(document.createElement('script'), {
        src: 'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3',
        async: true,
        onload: () => {
            const discEmbed = new Crate({ server: '1286573512831533056', channel: '1286573601687867433',
                location: ['bottom', 'right'], notifications: true, indicator: true, allChannelNotifications: true,
                defer: false, color: '#000000'
            });
            plppdo.on('domChanged', () => window.location.href.includes("khanacademy.org/profile") ? discEmbed.show() : discEmbed.hide() );
        }
    });
    document.body.appendChild(script);
}