plppdo.on('domChanged', () => {
    if (document.getElementById('tweaksTab')) return;

    const ul = document.createElement('ul');
    const tweaksTab = createTab(`${t('tweaks_tab')}`, '#', 'tweaksTab');
    
    tweaksTab.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        enableRoles();
        videoPlayback();
        playAudio('https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/2tr6ymgu.wav');

    });

    ul.appendChild(tweaksTab);
    KWSection.appendChild(ul);
});

function enableRoles() {
    fetch('https://pt.khanacademy.org/api/internal/graphql/UpdateRolesAndHomepage', { method: "POST", credentials: "include", headers: { "x-ka-fkey": "1" }, body: '{"operationName":"UpdateRolesAndHomepage","query":"mutation UpdateRolesAndHomepage($roles: [UserRole]!, $homepage: UserHomepage!) {\\n  updateRolesAndHomepageSettings(roles: $roles, homepage: $homepage) {\\n    user {\\n      id\\n      isTeacher\\n      isParent\\n      homepageUrl\\n      __typename\\n    }\\n    error {\\n      code\\n      __typename\\n    }\\n    __typename\\n  }\\n}","variables":{"roles":["TEACHER","PARENT"],"homepage":"COACH"}}' })
    .then(async () => { sendToast(`🪄 ${t('roles_enabled')}`, 3000); })
    .catch(e => { debug(`🚨 ${t('error_at')} tweaksTab.js\n${e}`); });
}
function videoPlayback() {
    fetch('https://pt.khanacademy.org/api/internal/graphql/SetVideo', { method: "POST", credentials: "include", headers: { "x-ka-fkey": "1" }, body: '{"operationName":"SetVideo","query":"mutation SetVideo($kaid: String!, $muteVideos: Boolean!, $showCaptions: Boolean!, $playbackRate: PlaybackRate!) {\\n  setSettings(\\n    kaid: $kaid\\n    muteVideos: $muteVideos\\n    showCaptions: $showCaptions\\n    playbackRate: $playbackRate\\n  ) {\\n    user {\\n      id\\n      muteVideos\\n      showCaptions\\n      playbackRate\\n      __typename\\n    }\\n    errors {\\n      code\\n      __typename\\n    }\\n    __typename\\n  }\\n}","variables":{"kaid":"kaid_1190508734245417993389344","muteVideos":true,"showCaptions":false,"playbackRate":"RATE_200_PERCENT"}}' })
    .then(async () => { sendToast(`🪄 ${t('video_playback_tweak')}`, 3000); })
    .catch(e => { debug(`🚨 ${t('error_at')} tweaksTab.js\n${e}`); });
}