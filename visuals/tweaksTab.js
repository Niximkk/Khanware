plppdo.on('domChanged', () => {
    if (document.getElementById('tweaksTab')) return;

    const ul = document.createElement('ul');
    const tweaksTab = createTab(`${t('tweaks_tab')}`, '#', 'tweaksTab');
    
    tweaksTab.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        enableRoles();
    });

    ul.appendChild(tweaksTab);
    KWSection.appendChild(ul);
    nav.appendChild(KWSection);
});

function enableRoles() {
    fetch('https://pt.khanacademy.org/api/internal/graphql/UpdateRolesAndHomepage', { method: "POST", credentials: "include", headers: { "x-ka-fkey": "1" }, body: '{"operationName":"UpdateRolesAndHomepage","query":"mutation UpdateRolesAndHomepage($roles: [UserRole]!, $homepage: UserHomepage!) {\\n  updateRolesAndHomepageSettings(roles: $roles, homepage: $homepage) {\\n    user {\\n      id\\n      isTeacher\\n      isParent\\n      homepageUrl\\n      __typename\\n    }\\n    error {\\n      code\\n      __typename\\n    }\\n    __typename\\n  }\\n}","variables":{"roles":["TEACHER","PARENT"],"homepage":"COACH"}}' })
    .then(async () => { sendToast(`🪄 ${t('roles_enabled')}`, 3000); })
    .catch(e => { debug(`🚨 ${t('error_at')} tweaksTab.js\n${e}`); });
}