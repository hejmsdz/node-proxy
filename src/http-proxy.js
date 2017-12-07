var http = require('http');
const { URL } = require('url')

http.createServer(onRequest).listen(8000);

function onRequest(client_req, client_res) {
    let url = new URL(client_req.url)
    console.log(url.hostname)
    //console.log('serve: ' + client_req.url)

    var options = {
        hostname: url.hostname,
        port: 80,
        path: client_req.url,
        method: 'GET'
    };

    var proxy = http.request(options, function (res) {
        console.log("RESPONSE: " + res.headers);
        res.pipe(client_res, {
            end: true
        });
    });

    client_req.pipe(proxy, {
        end: true
    });
}