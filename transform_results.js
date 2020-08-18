/* jshint node: true, esnext: true */

const htmlEncode = require('js-htmlencode');
const downsize = require('downsize');

const result_description_length = 250;

function get_title(result) {
  // Get title from result

  // Highlights take preference
  const hl = result.highlight;

  if (hl) {
    const highlight_priority = [
      'metadata.title', 'references.name',
    ];

    // Return the first one from the priority list
    for (let i = 0; i < highlight_priority.length; i++) {
      if (hl[highlight_priority[i]]) {
        return hl[highlight_priority[i]][0];
      }
    }
  }

  // Try metadata
  const src = result._source;
  const titles = [];

  if ('metadata' in src) {
    const metadata_priority = [
      'title', 'name',
    ];

    metadata_priority.forEach((item) => {
      if (src.metadata[item]) {
        titles.push(src.metadata[item][0]);
      }
    });
  }

  // Try references
  if (src.references) {
    src.references.forEach((item) => {
      if (item.name && item.name.length > 1) {
        titles.push(item.name);
      }
    });
  }

  // Pick longest title
  if (titles.length > 0) {
    titles.sort((a, b) => b.length - a.length);

    return htmlEncode.htmlEncode(titles[0]);
  }
  // Fallback to id
  return htmlEncode.htmlEncode(result._id);
}

function get_description(result) {
  // Use highlights, if available
  if (result.highlight) {
    if (result.highlight.content) {
      return result.highlight.content[0];
    }

    if (result.highlight['links.Name']) {
      // Reference name matching
      return `Links to &ldquo;${result.highlight['links.Name'][0]}&rdquo;`;
    }

    if (result.highlight['links.Hash']) {
      // Reference name matching
      return `Links to &ldquo;${result.highlight['links.Hash'][0]}&rdquo;`;
    }
  }

  const { metadata } = result._source;
  if (metadata) {
    // Description, if available
    if (metadata.description) {
      return htmlEncode.htmlEncode(
        downsize(metadata.description[0], {
          characters: result_description_length, append: '...',
        }),
      );
    }
  }

  // Default to nothing
  return null;
}

function get_mimetype(result) {
  const { metadata } = result._source;
  if (metadata && 'Content-Type' in metadata) {
    const type = result._source.metadata['Content-Type'][0];
    // "text/html; charset=ISO-8859-1" -> "text/html"
    return type.split(';', 1)[0];
  }
}

function getType(item) {
  const idx = item._index;

  if (idx.includes('files')) {
    return 'file';
  }

  if (idx.includes('directories')) {
    return 'directory';
  }

  throw new Error('Unknown type');
}

function transform_results(results) {
  const hits = [];

  results.hits.forEach((item) => {
    const obj = {
      hash: item._id,
      title: get_title(item),
      description: get_description(item),
      type: getType(item),
      size: item._source.size,
      'first-seen': item._source['first-seen'],
      'last-seen': item._source['last-seen'],
      score: item._score,
    };

    const mimetype = get_mimetype(item);
    if (mimetype) obj.mimetype = mimetype;

    hits.push(obj);
  });

  // Overwrite existing list of hits
  results.hits = hits;
}

module.exports = transform_results;
