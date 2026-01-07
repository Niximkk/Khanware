const originalFetch = window.fetch;

window.fetch = async function (input, init = {}) {
    let body;
    if (input instanceof Request) body = await input.clone().text();
    else if (init.body) body = init.body;
    if (features.minuteFarmer && body && input.url.includes("mark_conversions")) {
        try {
            if (body.includes("termination_event")) { sendToast(`🚫 ${t('time_limiter_blocked')}`, 1000); return; }
        } catch (e) { debug(`🚨 ${t('error_at')} minuteFarm.js\n${e}`); }
    }
    return originalFetch.apply(this, arguments);
};