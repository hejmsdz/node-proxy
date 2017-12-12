const http = require('http');
const { URL } = require('url');

/**
 * Send a HTTP request and return its result in form of a Promise.
 * @param {Object} options parameters for http.request
 * @param {string} body request body
 * @returns {Promise.<Object.<string, http.ServerResponse>>}
 */
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

/**
 * Perform the same HTTP request throught a proxy and directly
 * @param {string} proxyHost 
 * @param {number} proxyPort 
 * @param {string} url 
 * @param {object} headers 
 * @param {object} moreOptions additional parameters for http.request
 * @param {string} body request body
 * @returns {Promise.<Array.<Object.<string, http.ServerResponse>>>}
 */
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