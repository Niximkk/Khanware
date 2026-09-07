const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const { startServer } = require('./server');
const { launchBrowser, reloadAndReinject } = require('./browser');
const CONFIG = require('./dev.config.js');

let reloadTimer = null;
const DEBOUNCE_MS = 150;

async function main() {
  const { broadcastReload } = startServer({
    projectRoot: CONFIG.projectRoot,
    port: CONFIG.localServerPort,
  });

  const { browser, page } = await launchBrowser({
    userDataDir: CONFIG.userDataDir,
    targetUrl: CONFIG.targetUrl,
    localServerPort: CONFIG.localServerPort,
    mainScriptFile: CONFIG.mainScriptFile,
  });

  const watcher = chokidar.watch(CONFIG.projectRoot, {
    ignored: [
      /node_modules/,
      /\.git/,
      __dirname,
    ],
    ignoreInitial: true,
  });

  watcher.on('all', (event, changedPath) => {
    const rel = path.relative(CONFIG.projectRoot, changedPath);
    console.log(chalk.blue(`[watch] ${event}: ${rel}`));

    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async () => {
      try {

        await reloadAndReinject(page, CONFIG.localServerPort, CONFIG.mainScriptFile);
        broadcastReload();
      } catch (err) {
        console.log(chalk.red(`[watch] reload error: ${err.message}`));
      }
    }, DEBOUNCE_MS);
  });

  console.log(chalk.green.bold('\n✔ Dev environment running. Editing any project file will automatically reload Chrome.\n'));

  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\nShutting down...'));
    await browser.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
