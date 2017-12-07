const http = require('http');
const { URL } = require('url');

const ProxyServer = http.createServer((req, res) => {
  const url = new URL(req.url);
  const options = {
    hostname: url.hostname,
    port: 80,
    path: url.pathname,
    method: 'GET'
  };
  console.log(url.href);

  const proxy = http.request(options, function (proxyRes) {
    proxyRes.pipe(res, {
      end: true
    });
  });

  req.pipe(proxy, {
    end: true
  });
});

module.exports = ProxyServer;