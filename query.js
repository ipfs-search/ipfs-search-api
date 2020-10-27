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
    '"hash"^5',
    '"metadata.isbn"^5',
    'metadata.title^10',
    'metadata.name^10',
    'references.name^6',
    'metadata.author^4',
    'metadata.xmpDM:artist^4',
    '"references.parent_hash"^3',
    'metadata.xmpDM:composer^3',
    'metadata.description^3',
    'metadata.keywords^3',
    'links.Name^3',
    'metadata.xmpDM:album^2',
    'metadata.xmpDM:albumArtist^2',
    'metadata.publisher^2',
    'metadata.producer^2',
    '"links.Hash"^2',
    'metadata.Content-Type^2',
    'content',
    'fingerprint',
    // 'metadata.Author', // TO INDEX!!!
    // 'metadata.Keywords'
    // 'metadata.creator',
    // 'metadata.contributor'
    // 'metadata.subject',
    'urls',
  ],
  sourceFields: [
    'metadata.title',
    'metadata.name',
    'metadata.Author',
    'metadata.description',
    'metadata.Content-Type',
    'metadata.Creation-Date',
    'metadata.publisher',
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
                from: 'now-3M',
              },
            },
          },
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
                from: 'now-1d',
              },
            },
          },
          weight: 1,
        },
        // Also boost first-seen if they don't have last-seen defined
        {
          filter: {
            bool: {
              must_not: [
              { exists: { field: 'last-seen' } },
              ],
              must: [
              {
                range: {
                  'first-seen': {
                    from: 'now-3M',
                  },
                },
              },
              ],
            },
          },
          weight: 1,
        },
        {
          filter: {
            bool: {
              must_not: [
              { exists: { field: 'last-seen' } },
              ],
              must: [
              {
                range: {
                  'first-seen': {
                    from: 'now-1M',
                  },
                },
              },
              ],
            },
          },
          weight: 1,
        },
        {
          filter: {
            bool: {
              must_not: [
              { exists: { field: 'last-seen' } },
              ],
              must: [
              {
                range: {
                  'first-seen': {
                    from: 'now-1d',
                  },
                },
              },
              ],
            },
          },
          weight: 1,
        },
      ],
    },
  }),
  // Bias against unnamed items
  boostUnnamed: (query) => ({
    boosting: {
      positive: query,
      negative: {
        bool: {
          filter: [
            { exists: { field: 'metadata.title' } },
            { exists: { field: 'metadata.name' } },
            { exists: { field: 'references.Name' } },
          ],
        },
      },
      negative_boost: 0.1,
    },
  }),
};

module.exports = q;
