const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const chalk = require('chalk');

function startServer({ projectRoot, port }) {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    next();
  });

  app.use(express.static(projectRoot, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    },
  }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/__livereload' });

  function broadcastReload() {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send('reload');
    });
  }

  server.listen(port, () => {
    console.log(chalk.green(`[server] serving ${projectRoot} at http://localhost:${port}/`));
  });

  return { broadcastReload, wss };
}

module.exports = { startServer };
