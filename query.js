const q = {
  queryFields: [
    '"hash"^5',
    '"metadata.isbn"^5',
    'metadata.title^5',
    'metadata.name^5',
    'references.name^5',
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
    'metadata.title', 'metadata.name', 'metadata.description',
    'metadata.Content-Type', 'references', 'size', 'last-seen', 'first-seen',
  ],
  // Create a simple boolean string query
  string: (query, fields) => ({
    query,
    fields,
    default_operator: 'AND',
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
