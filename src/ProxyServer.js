const http = require('http');
const { URL } = require('url');
const CacheWriter = require('./cache/CacheWriter');
const CacheReader = require('./cache/CacheReader');
const IsCacheable = require('./cache/IsCacheable');
const Log = require('./Log');
const fs = require('fs');
const Config = require('./Config.js');


const logger = new Log(process.stdout);


/* Configuration variables. Will be overwritten by config file.
   But if the end-user typed something wrong than use our default
   values. */
let useCache = false;
let isReverse = false;
let cacheConfig = {
  'headerFileSuffix': '.headers',
  'bodyFileSuffix': '.body',
  'folder': '/cache/'
};




/* Read the configuration file and save config as variables. */
const config = new Config();

const configPathsServer = [
  'server.useCache',
  'server.isReverse'
];

const configPathsCache = [
  'cache.headerFileSuffix',
  'cache.bodyFileSuffix',
  'cache.folder'
];

config.get(configPathsServer, (err, values) => {
  if(err) {
    logger.error('Unable to read configuration file.');
  } else {
    useCache = values['server.useCache'];
    isReverse = values['server.isReserve'];
  }
});

config.get(configPathsCache, (err, values) => {
  if(err) {
    logger.error('Unable to read configuration file.');
  } else {
    cacheConfig.headerFileSuffix = values['cache.headerFileSuffix'];
    cacheConfig.bodyFileSuffix = values['cache.bodyFileSuffix'];
    cacheConfig.folder = values['cache.folder'];
  }
});




/**
 * The proxy server retrieves requests from clients, forwards them to
 * a remote server, and returns a response to the client. In this process,
 * the proxy server can act as a cache server and cache certain data.
 **/
const ProxyServer = http.createServer((req, res) => {
  logger.info('Client requested data.', req.url);

  if(useCache) {
    const cacheReader = new CacheReader(req.url, cacheConfig);

    /* Check if the requested file is already in the cache (no error) or react accordingly */
    cacheReader.useCache((err, cachedHeaders, cachedBodyStream) => {
      if(err) {
        /* Nothing found in the cache: Make a normal request */
        logger.info('Cannot use the cache.', req.url);

        requestServer(req, (originRes) => {
          /* Send data to client */
          res.writeHead(200, originRes.headers);
          //res.writeHead(originRes.statusCode, originRes.headers);
          originRes.pipe(res, {end: true});

          logger.success('Reply sent to client.', req.url);
        });
      } else {
        /* File found on the cache. Now lets find out if it is up-to-date
           via a conditional request which uses the ETag */

        logger.info('Found data in the cache.', req.url);

        /* Conditional request only possible when the headers file contains
           information like the etag because the actuality can of course only
           be checked if we have something to compare. */
        if(cachedHeaders.hasOwnProperty('etag')) {
          requestServerConditional(req, cachedHeaders.etag, (condOriginRes) => {
            if(condOriginRes.statusCode == "200") {
              /* Modified */
              logger.info('Cache is modified. Received updated files.', req.url);

              /* Send data to client */
              res.writeHead(200, condOriginRes.headers);
              logger.debug(condOriginRes.statusCode);
              //res.writeHead(condOriginRes.statusCode, condOriginRes.headers);
              condOriginRes.pipe(res, {end: true});

              logger.success('Reply sent to client.', req.url);
            } else if(condOriginRes.statusCode == "304") {
              /* Not Modified */
              logger.info('Cache is not modified.', req.url);

              /* Send data to client */
              res.writeHead(200, cachedHeaders); // Problem: The headers file dont save the statuscode. Should we use 200?
              cachedBodyStream.pipe(res, {end: true});

              logger.success('Cached reply sent to client.', req.url);
            } else {
              logger.error('TODO: React accordingly on a wrong statusCode.', req.url);
            }
          });
        } else {
          logger.info('Want to make a conditional request, but not possible. Data must be requested from the origin server.',
                  req.url);

          requestServer(req, (originRes) => {
            /* Send data to client */
            res.writeHead(200, originRes.headers);
            //res.writeHead(originRes.statusCode, originRes.headers);
            originRes.pipe(res, {end: true});

            logger.success('Reply sent to client.', req.url);
          });
        }
      }
    });
  } else {
    requestServer(req, (originRes) => {
      /* Send data to client */
      res.writeHead(200, originRes.headers);
      //res.writeHead(originRes.statusCode, originRes.headers);
      originRes.pipe(res, {end: true});

      logger.success('Reply sent to client.', req.url);
    });
  }
});






/**
 * Send a HTTP condicional request to a server and sends the response
 * as a <http.ServerResponse> to the callback function
 * @param {http.IncomingMessage} req request of the client
 * @param {string} etag the etag for insterting in the header
 * @param {function} fn callback function
 */
function requestServerConditional(req, etag, fn) {
  logger.info('Send a conditional request to origin server.', req.url);

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
      logger.error(`Problem with request: ${err.message}`, req.url);
    });

    proxy.end(); // TODO
  } else {
    /* TODO */
    /* It could be possible that the method is not cachable.... */
    logger.error('Todo: Not possible to cache.', req.url);
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
  logger.info('Send a request to origin server.', req.url);

  const url = new URL(req.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, function (proxyRes) {
    //let sendBack = proxyRes;
    if (IsCacheable() && useCache) {
      let cacheWriter = new CacheWriter(req.url, proxyRes, cacheConfig);
      sendBack = proxyRes.pipe(cacheWriter, {end: false});

      logger.info('Cached successfully data.', req.url);
    }

    fn(proxyRes); // TODO? Das ist der Grund wieso es geht? Eigewntlich muss sendback hier hin
  });

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
