const express = require('express');
const transform = require('./transform_results');
const search = require('./search');

const app = express();
const port = 9615;

function error(res, code, err) {
  console.debug(`${code}: ${err}`);
  res.json({ error: err }).status(code).end();
}

app.get('/search', (req, res) => {
  const maxPage = 100;
  const pageSize = 15;

  if (!('q' in req.query)) {
    error(res, 422, 'query argument missing');
  }

  let page = 0;

  if ('page' in req.query) {
    page = parseInt(req.query.page, 10);

    // For performance reasons, don't allow paging too far down
    if (page > maxPage) {
      error(res, 422, 'paging not allowed beyond 100');
    }
  }

  search(req.query.q, page, pageSize).then((r) => {
    const { hits } = r.body;

    console.debug(`${req.url} 200: Returning ${hits.hits.length} results`);

    hits.page_size = pageSize;
    hits.page_count = Math.ceil(hits.total / pageSize);

    transform(hits);

    res.json(hits).end();
  }, (e) => {
    error(res, 500, 'Internal server error');
    console.trace(e);
  });
});

app.listen(port, () => console.log(`ipfs-search search API listening on port ${port}!`));
