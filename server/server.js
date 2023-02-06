const express = require('express');
const transformSearch = require('./search/transform_results');
const search = require('./search/search');
const getMetadata = require('./metadata/get_metadata');
const cidValidator = require('./metadata/cid_validator');

const app = express();
const port = 9615;

function error(req, res, code, err) {
  console.error(`${req.url} ${code}: ${err}`);

  // Unwrap ES errors.
  if (typeof err === 'object' && 'body' in err && 'error' in err.body) {
    err = err.body.error;
  }

  if (process.env.NODE_ENV === 'production') {
    // Don't leak production errors
    err = 'Internal Server Error'
  } else {
    console.trace(err);
  }

  res.status(code).json({ error: `${err}` }).end();
}

// https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', true);

app.get('/search', (req, res, next) => {
  const maxPage = 100;
  const pageSize = 15;

  if (!('q' in req.query)) {
    error(req, res, 400, 'query argument missing');
  }

  let page = 0;

  if ('page' in req.query) {
    page = parseInt(req.query.page, 10);

    // For performance reasons, don't allow paging too far down
    if (page > maxPage) {
      error(req, res, 400, 'paging not allowed beyond 100');
    }
  }

  search(req.query.q, req.query.type, page, pageSize, req.ip).then((r) => {
    const { hits } = r.body;

    console.debug(`${req.url} 200: Returning ${hits.hits.length} results`);

    hits.page_size = pageSize;
    hits.page_count = Math.ceil(hits.total.value / pageSize);

    // Backwards compatibility
    hits.total = hits.total.value;

    transformSearch(hits);

    res.json(hits).end();
  }).catch(next);
});

app.get('/metadata/:cid/', function (req, res, next) {
    if (!req.params['cid']) invalid_requst(res)

    let cid = req.params['cid']

    if (!cidValidator.Validate(cid)) {
      error(req, res, 400, 'invalid cid');
    }

    getMetadata(cid).then((r) => {
      res.json(r).end();
    }).catch(next);
})

app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  error(req, res, 500, err);
});

app.listen(port, '127.0.0.1', () => console.log(`ipfs-search search API listening on port ${port}!`));
