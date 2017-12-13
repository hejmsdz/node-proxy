const http = require('http');
const { URL } = require('url');
const CacheWriter = require('./cache/CacheWriter');
const CacheReader = require('./cache/CacheReader');
const IsCacheable = require('./cache/IsCacheable');
const fs = require('fs');

/* Configuration variables */
const _DEBUG = true;

const ProxyServer = http.createServer((req, res) => {
  const cacheReader = new CacheReader(req.url);

  /* Check if the requested file is already in the cache (no error) or react accordingly */
  cacheReader.useCache((err, cachedHeaders, cachedBodyStream) => {
    if(err) {
      /* Nothing found in the cache: Make a normal request */
      requestServer(req, (originRes) => {
        res.writeHead(200, originRes.headers);
        originRes.pipe(res, {end: true});
      });

      if(_DEBUG) { console.log('Not possible to use a cache.'); }
    } else {
      /* File found on the cache. Now lets find out if it is up-to-date via a conditional request which uses the ETag */
      const etag = "swubn"; // Placeholder - Try all with httpbin.com/etag/swubn

      requestServerCondicional(req, etag, (condOriginRes) => {
        if(condOriginRes.statusCode == "200") {
          /* Modified */
          if(_DEBUG) { console.log('Cache is not up-to-date. Got files from origin server..'); }

          res.writeHead(200, condOriginRes.headers);
          condOriginRes.pipe(res, {end: true});
        } else if(condOriginRes.statusCode == "304") {
          /* Not Modified */
          res.writeHead(200, cachedHeaders);
          cachedBodyStream.pipe(res, {end: true});

          if(_DEBUG) { console.log('Succesfully used a (not-modified) chached file.'); }
        } else {
          if(_DEBUG) { console.log('TODO: Theres something strange going on...'); }
        }
      });
    }
  });
});

/**
 * Send a HTTP condicional request to a server and sends the response
 * as a <http.ServerResponse> to the callback function
 * @param {http.IncomingMessage} req request of the client
 * @param {string} etag the etag for insterting in the header
 * @param {function} fn callback function
 */
function requestServerCondicional(req, etag, fn) {
  if(IsCacheable()) {
    const url = new URL(req.url);
    const modHeaders = req.headers;
    modHeaders["If-None-Match"] = etag;
    console.log("modified headers: " + JSON.stringify(modHeaders));

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: modHeaders
    };

    if(_DEBUG) { console.log('Sending a GET condicional...'); }

    const proxy = http.request(options, (res) => {
      fn(res);
    });

    proxy.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
    });

    proxy.end();
  } else {
    /* TODO */
    /* could be possible that the method is not cachable.... */
    console.log('todo: not possible to cache.');
  }
}

/**
 * Send a HTTP request to a server and sends the response
 * as a <http.ServerResponse> to the callback function
 * @param {http.IncomingMessage} req request of the client
 * @param {string} etag the etag for insterting in the header
 * @returns {function} fn callback function
 */
function requestServer(req, fn) {
  const url = new URL(req.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: req.headers
  };

  if(_DEBUG) { console.log(url.href); }

  const proxy = http.request(options, function (proxyRes) {
    let sendBack = proxyRes;
    if (IsCacheable()) {
      let cacheWriter = new CacheWriter(req.url, proxyRes);
      sendBack = proxyRes.pipe(cacheWriter, {end: true});

      if(_DEBUG) { console.log('Cached sucessfully data from origin server.'); }
    }

    fn(sendBack);
  });

  proxy.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.pipe(proxy, {
    end: true
  }).on('error', (err) => {
      console.log(err);
  });
}

module.exports = ProxyServer;
