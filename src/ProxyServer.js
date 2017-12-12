const http = require('http');
const { URL } = require('url');

const ProxyServer = http.createServer((req, res) => {
  const url = new URL(req.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: req.headers
  };
  console.log(url.href);

  const proxy = http.request(options, function (proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, {
      end: true
    });
  });

  req.pipe(proxy, {
    end: true
  });
});

module.exports = ProxyServer;