const http = require('http');

const ProxyServer = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(`URL: ${req.url}\n`);
  res.write(`Headers: ${JSON.stringify(req.headers)}`);
  res.end();
});

module.exports = ProxyServer;