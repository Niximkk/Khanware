const path = require('path');

module.exports = {
  projectRoot: path.resolve(__dirname, '../'),
  mainScriptFile: 'Khanware.js',
  targetUrl: 'https://pt.khanacademy.org/profile/me/courses',
  localServerPort: 8787,
  userDataDir: path.resolve(__dirname, '.chrome-profile'),
};
