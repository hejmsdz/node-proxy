const ProxyServer = require('../src/ProxyServer.js');
const Tester = require('../src/Tester.js');
const helpers = require('./helpers/helpers.js');

describe('Basic proxy server', () => {
  let port = 8084;
  beforeAll(() => {
    ProxyServer.listen(port);
  });

  afterAll(() => {
    ProxyServer.close();
  });

  describe('a simple GET request', () => {
    let req;
    beforeAll(() => {
      req = Tester('localhost', port, 'http://httpbin.org/anything');
    });

    it('returns the same request body', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.data).toEqual(direct.data);
        done();
      });
    });

    it('has a matching Server header', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.res.headers.server).toEqual(direct.res.headers.server);
        done();
      });
    });
  });

  describe('GET request with a query string', () => {
    let req;
    beforeAll(() => {
      req = helpers.parseJSONs(Tester('localhost', port, 'http://httpbin.org/anything?hello=world'));
    });

    it('passes the query string correctly', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.args).toEqual(direct.args);
        done();
      });
    });
  });
});