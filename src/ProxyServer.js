const http = require('http');
const { URL } = require('url');

const reverseProxyTable = {
  'horario': 'localhost:3000',
  'personal': 'localhost:4000',
};

const ProxyServer = http.createServer((req, res) => {
  //const url = new URL(req.url);

  let pathParts = req.url.split('/');
  console.log(pathParts);
  let app = pathParts[1];
  if (pathParts.length < 1 || !(app in reverseProxyTable)) {
    res.writeHead(400);
    res.end('error');
    return;
  }
  let path = pathParts.slice(2).join('/');


  let target = reverseProxyTable[app];
  let [targetHost, targetPort] = target.split(':');

  const options = {
    hostname: targetHost,
    port: targetPort,
    path: path,
    method: req.method,
    headers: req.headers
  };
  console.log(req.url);

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