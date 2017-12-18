const ProxyServer = require('../src/ProxyServer.js');
const Tester = require('../src/Tester.js');
const helpers = require('./helpers/helpers.js');

describe('Basic proxy server', () => {
  let port = 8084;
  let proxy;
  beforeAll(() => {
    proxy = new ProxyServer(false);
    proxy.listen(port);
  });

  afterAll(() => {
    proxy.close();
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

  describe('GET request with a header', () => {
    let req;
    beforeAll(() => {
      req = helpers.parseJSONs(Tester('localhost', port, 'http://httpbin.org/anything', {
        Cookie: 'hello=world'
      }));
    });

    it('passes the header correctly', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.headers.Cookie).toEqual(direct.headers.Cookie);
        done();
      });
    });
  });

  describe('response with a different status code', () => {
    let req;
    beforeAll(() => {
      req = Tester('localhost', port, 'http://httpbin.org/status/404');
    });

    it('returns a correct status code', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.res.statusCode).toEqual(direct.res.statusCode);
        done();
      });
    });
  });

  describe('POST request', () => {
    let req;
    beforeAll(() => {
      req = helpers.parseJSONs(Tester(
        'localhost', port,
        'http://httpbin.org/anything',
        { 'Content-Type': 'application/x-www-form-urlencoded' },
        { method: 'POST' },
        'hello=world'
      ));
    });

    it('uses the correct method', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.method).toEqual(direct.method);
        done();
      });
    });

    it('passes the form data correctly', (done) => {
      req.then(([proxy, direct]) => {
        expect(proxy.form).toEqual(direct.form);
        done();
      });
    });
  });
});