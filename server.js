const express = require('express');
const transform = require('./transform_results');
const search = require('./search');
const searchDocuments = require('./search_documents');

const app = express();
const port = 9615;

function error(res, code, err) {
  console.error(`${code}: ${err}`);
  console.trace(err);

  // Unwrap ES errors.
  if (typeof err === 'object' && 'body' in err && 'error' in err.body) {
    console.trace(err.body.error);
  }

  res.json({ error: `${err}` }).status(code).end();
}

app.get('/search', (req, res, next) => {
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

  search(req.query.q, req.query.type, page, pageSize).then((r) => {
    const { hits } = r.body;

    console.debug(`${req.url} 200: Returning ${hits.hits.length} results`);

    hits.page_size = pageSize;
    hits.page_count = Math.ceil(hits.total.value / pageSize);

    // Backwards compatibility
    hits.total = hits.total.value;

    transform(hits);

    res.json(hits).end();
  }).catch(next);
});

app.get('/search/books', (req, res, next) => {
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

  searchDocuments(req.query.q, page, pageSize).then((r) => {
    const { hits } = r.body;

    console.debug(`${req.url} 200: Returning ${hits.hits.length} results`);

    hits.page_size = pageSize;
    hits.page_count = Math.ceil(hits.total.value / pageSize);

    // Backwards compatibility
    hits.total = hits.total.value;

    transform(hits);

    res.json(hits).end();
  }).catch(next);
});

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Don't leak details in production
    error(res, 500, 'Internal Server Error');
  }

  if (res.headersSent) {
    return next(err);
  }

  error(res, 500, err);
});

app.listen(port, () => console.log(`ipfs-search search API listening on port ${port}!`));
