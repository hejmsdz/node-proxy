const http = require('http');
const { URL } = require('url');
const ProxyServer = require('./ProxyServer.js');

function httpPromise(options, body = '') {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';  
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({data, res});
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });

    req.end(body);
  });
}

function testRequest(proxyHost, proxyPort, url, headers = {}, moreOptions = {}, body = '') {
  url = new URL(url);
  const proxyOptions = Object.assign({
    method: 'GET',
    host: proxyHost,
    port: proxyPort,
    path: url.href,
    headers: Object.assign({
      host: url.host
    }, headers)
  }, moreOptions);

  const directOptions = Object.assign({
    method: 'GET',
    host: url.host,
    port: url.proxy,
    path: url.href,
    headers: headers
  }, moreOptions);

  return Promise.all([
    httpPromise(proxyOptions, body),
    httpPromise(directOptions, body)
  ]);
}

module.exports = testRequest;