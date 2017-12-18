const http = require('http');
const { URL } = require('url');
const CacheWriter = require('./cache/CacheWriter');
const CacheReader = require('./cache/CacheReader');
const IsCacheable = require('./cache/IsCacheable');
const Log = require('./Log');
const rootFolder = require('app-root-path');

const logger = new Log(process.stdout);

/* Configuration variables. */
let cacheConfig = {
  'headerFileSuffix': '.headers',
  'bodyFileSuffix': '.body',
  'folder': '/cache/'
};

/**
 * The proxy server retrieves requests from clients, forwards them to
 * a remote server, and returns a response to the client. In this process,
 * the proxy server can act as a cache server and cache certain data.
 **/
class ProxyServer extends http.Server {
  constructor(useCache) {
    super();

    this.useCache = useCache;
    this.on('request', this.handleRequest);
  }

  handleRequest(req, res) {
    logger.info('Incoming request:', req.url);

    if (this.useCache) {
      const cacheReader = new CacheReader(req.url, cacheConfig);

      /* Check if the requested file is already in the cache (no error) or react accordingly */
      cacheReader.useCache((cachedHeaders, cachedBodyStream) => {
        /* Requested URL found in the cache */
        logger.info('Found data in the cache.', req.url);

        this.checkFreshness(req, cachedHeaders, (originRes) => {
          /* New, modified data received */
          this.passResponse(res, originRes, new CacheWriter(req.url, originRes, cacheConfig));
        }, () => {
          /* Not modified */
          this.passResponse(res, Object.assign(cachedBodyStream, {
            statusCode: 200,
            headers: cachedHeaders
          }));
        });
      }, () => {
        /* Nothing found in the cache: Make a normal request and cache the result if possible. */
        logger.info('Cache miss', req.url);
        this.requestAndPass(req, res, true);
      });
    } else {
      this.requestAndPass(req, res);
    }
  }

  checkFreshness(req, cachedHeaders, onModified, onNotModified) {
    let lastModified = cachedHeaders['last-modified'] || cachedHeaders['date'];
    if (!lastModified) {
      return onNotModified();
    }

    logger.info(`Conditional[${lastModified}]`, req.url);
    requestServer(req, (originRes) => {
      if (originRes.statusCode == 304) {
        logger.debug('Not modified');
        onNotModified();
      } else {
        logger.debug('Modified');
        onModified(originRes);
      }
    }, {'if-modified-since': lastModified});
  }

  requestAndPass(req, res, writeToCache) {
    logger.info('Send a request to origin server.', req.url);
    requestServer(req, (originRes) => {
      let pipeThrough = null;
      if (writeToCache && IsCacheable(req, originRes)) {
        pipeThrough = new CacheWriter(req.url, originRes, cacheConfig);
      }
      this.passResponse(res, originRes, pipeThrough);
    });
  }

  passResponse(res, originRes, pipeThrough = null) {
    let sendBack = originRes;
    res.writeHead(originRes.statusCode, originRes.headers);
    if (pipeThrough !== null) {
      sendBack = originRes.pipe(pipeThrough, {end: true});
    }
    sendBack.pipe(res, {end: true});
  }
}

/**
 * Send a HTTP request to a server and sends the response
 * as a <http.ServerResponse> to the callback function
 * @param {http.IncomingMessage} req request of the client
 * @param {Object} moreHeaders additional request headers
 * @returns {function} fn callback function
 */
function requestServer(req, fn, moreHeaders = {}) {
  const url = new URL(req.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: Object.assign(req.headers, moreHeaders)
  };

  const proxy = http.request(options, fn);

  proxy.on('error', (err) => {
    logger.error(`Problem with request: ${err.message}`, req.url);
  });

  req.pipe(proxy, {
    end: true
  }).on('error', (err) => {
    logger.error(`Problem with request: ${err.message}`, req.url);
  });
}

module.exports = ProxyServer;
