const http = require('http');
const { URL } = require('url');
const CacheWriter = require('./cache/CacheWriter');
const CacheReader = require('./cache/CacheReader');
const IsCacheable = require('./cache/IsCacheable');
const Log = require('./Log');
const fs = require('fs');

const ProxyServer = http.createServer((req, res) => {
  Log.logToFile('Client requested data.', req.url);

  const cacheReader = new CacheReader(req.url);

  /* Check if the requested file is already in the cache (no error) or react accordingly */
  cacheReader.useCache((err, cachedHeaders, cachedBodyStream) => {
    if(err) {
      /* Nothing found in the cache: Make a normal request */
      Log.logToFile('Cannot use the cache. Data must be requested from the origin server.', req.url);

      requestServer(req, (originRes) => {
        //res.writeHead(originRes.statusCode, originRes.headers);
        res.writeHead(200, originRes.headers);
        originRes.pipe(res, {end: true});
      });
    } else {
      /* File found on the cache. Now lets find out if it is up-to-date
         (only possible when the header file contains information like the etag)
         via a conditional request which uses the ETag */

      Log.logToFile('Found data in the cache.', req.url);

      if(cachedHeaders.hasOwnProperty('etag')) {
        requestServerConditional(req, cachedHeaders.etag, (condOriginRes) => {
          if(condOriginRes.statusCode == "200") {
            /* Modified */
            Log.logToFile('Cache is modified. Received updated files.', req.url);

            res.writeHead(200, condOriginRes.headers);
            //res.writeHead(condOriginRes.statusCode, condOriginRes.headers);
            condOriginRes.pipe(res, {end: true});
          } else if(condOriginRes.statusCode == "304") {
            /* Not Modified */
            res.writeHead(200, cachedHeaders); // Problem: The headers file dont save the statuscode. Should we use 200?
            cachedBodyStream.pipe(res, {end: true});

            Log.logToFile('Cache is not modified. Successfully used a cached file.', req.url);
          } else {
            Log.logToFile('TODO: React accordingly on a wrong statusCode.', req.url);
          }
        });
      } else {
        Log.logToFile('Want to make a conditional request, but not possible. Data must be requested from the origin server.',
                req.url);

        requestServer(req, (originRes) => {
          //res.writeHead(originRes.statusCode, originRes.headers);
          res.writeHead(200, originRes.headers);
          originRes.pipe(res, {end: true});
        });
      }
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
function requestServerConditional(req, etag, fn) {
  Log.logToFile('Send a conditional request to origin server.', req.url);

  if(IsCacheable()) {
    const url = new URL(req.url);
    const modHeaders = req.headers;
    modHeaders["If-None-Match"] = etag;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: modHeaders
    };

    const proxy = http.request(options, (res) => {
      fn(res);
    });

    proxy.on('error', (err) => {
      Log.logToFile(`Problem with request: ${err.message}`, req.url);
    });

    proxy.end();
  } else {
    /* TODO */
    /* It could be possible that the method is not cachable.... */
    Log.logToFile('Todo: Not possible to cache.', req.url);
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
  Log.logToFile('Send a request to origin server.', req.url);

  const url = new URL(req.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, function (proxyRes) {
    let sendBack = proxyRes;
    if (IsCacheable()) {
      let cacheWriter = new CacheWriter(req.url, proxyRes);
      sendBack = proxyRes.pipe(cacheWriter, {end: true});

      Log.logToFile('Cached successfully data from origin server.', req.url);
    }

    fn(sendBack);
  });

  proxy.on('error', (err) => {
    Log.logToFile(`Problem with request: ${err.message}`, req.url);
  });

  req.pipe(proxy, {
    end: true
  }).on('error', (err) => {
      Log.logToFile(`Problem with request: ${err.message}`, req.url);
  });
}

module.exports = ProxyServer;
