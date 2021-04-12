const q = {
  mimeTypes: {
    document: [
      // eBook types
      'application/x-mobipocket-ebook',
      'application/epub+zip',
      'application/vnd.amazon.ebook',
      // Scanned documents
      'image/vnd.djvu',
      'application/pdf',
      // HTML/plain text
      'text/html',
      'text/plain',
      // Text editors
      'application/postscript',
      'application/rtf',
      // Open Office et al.
      'application/vnd.oasis.opendocument.text',
      'application/vnd.sun.xml.writer',
      'application/vnd.stardivision.writer',
      'application/x-starwriter',
      // MS Word
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Misc
      'application/x-abiword',
    ],
  },
  queryFields: [
    "_id^10",
    "metadata.identifier^10",
    "metadata.title^10",
    "references.name^8",
    "metadata.subject^5",
    "metadata.xmpDM:album^5",
    "metadata.dc:creator^4",
    "metadata.xmpDM:compilation^4",
    "metadata.description^3",
    "references.parent_hash^3",
    "links.Name^3",
    "links.Hash^2",
    "metadata.Content-Type^2",
    "metadata.X-Parsed-By",
    "content",
    "urls"
  ],
  // TODO: Return more fields from the goodies we have.
  sourceFields: [
    'metadata.title',
    'metadata.dc:creator',
    'metadata.description',
    'metadata.Content-Type',
    'metadata.dcterms:created',
    'references',
    'size',
    'last-seen',
    'first-seen',
  ],
  // Create a simple boolean string query
  string: (query, fields) => ({
    query,
    fields,
    default_operator: 'AND',
    // analyzer: 'stop', gives performance problems as it generates single-letter tokens
    // quote_analyzer: 'keyword',
  }),
  // Bias more recent items
  recent: (query) => ({
    function_score: {
      query: {
        query_string: query,
      },
      score_mode: 'sum',
      boost_mode: 'multiply',
      functions: [
        {
          weight: 1,
        },
        {
          filter: {
            range: {
              'last-seen': {
                from: 'now-1M',
              },
            },
          },
          weight: 1,
        },
        {
          filter: {
            range: {
              'last-seen': {
                from: 'now-1w',
              },
            },
          },
          weight: 1,
        },
        {
          filter: {
            range: {
              'last-seen': {
                from: 'now-1d',
              },
            },
          },
          weight: 1,
        }
      ]
    }
  }),
  // Bias against unnamed items
  boostUnnamed: (query) => ({
    boosting: {
      positive: query,
      negative: {
        bool: {
          filter: [
            { exists: { field: 'metadata.title' } },
            { exists: { field: 'references.Name' } },
          ],
        },
      },
      negative_boost: 0.5,
    },
  }),
};

module.exports = q;
