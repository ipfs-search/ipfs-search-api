/* jshint node: true, esnext: true */
'use strict';

const http = require('http');
const url = require('url');

const transform_results = require('./transform_results');
const search = require('./search');

const server_port = 9615;

function error_response(response, code, error) {
  console.trace(code+": "+error.message);

  response.writeHead(code, {"Content-Type": "application/json"});
  response.write(JSON.stringify({
    "error": error
  }));
  response.end();
}

console.info("Starting server on http://localhost:"+server_port+"/");

http.createServer(function(request, response) {
  const page_size = 15;
  var parsed_url;

  try {
    try {
      parsed_url = url.parse(request.url, true);
    } catch(err) {
      error_response(response, 400, err.message);
    }

    if (parsed_url.pathname === "/search") {
      if (!"q" in parsed_url.query) {
        error_response(response, 422, "query argument missing");
      }

      var page = 0;
      const max_page = 100;

      if ("page" in parsed_url.query) {
        page = parseInt(parsed_url.query.page, 10);

        // For performance reasons, don't allow paging too far down
        if (page > 100) {
          error_response(422, "paging not allowed beyond 100");
        }
      }

      search(parsed_url.query.q, page, page_size).then(function (body) {
        console.info(request.url + " 200: Returning " + body.hits.hits.length + " results");

        body.hits.page_size = page_size;
        body.hits.page_count = Math.ceil(body.hits.total/page_size);

        transform_results(body.hits);

        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(body.hits, null, 4));
        response.end();
      }, function (error) {
        throw(error);
      });

    } else {
        error_response(response, 404, "file not found");
    }

  } catch(err) {
    // Catch generic errors
    error_response(response, 500, err.message);
  } finally {

  }
}).listen(server_port);

