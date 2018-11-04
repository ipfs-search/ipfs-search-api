/* jshint node: true, esnext: true */
'use strict';

const htmlEncode = require('js-htmlencode');
const downsize = require('downsize');

function get_title(result) {
  // Get title from result

  // Highlights take preference
  var hl = result.highlight;

  if (hl) {
    const highlight_priority = [
      "metadata.title", "references.name"
    ];

    // Return the first one from the priority list
    for (var i=0; i<highlight_priority.length; i++) {
      if (hl[highlight_priority[i]]) {
        return hl[highlight_priority[i]][0];
      }
    }
  }

  // Try metadata
  var src = result._source;
  var titles = [];

  if ("metadata" in src) {
    const metadata_priority = [
      "title", "name"
    ];

    metadata_priority.forEach(function (item) {
      if (src.metadata[item]) {
        titles.push(src.metadata[item][0]);
      }
    });
  }

  // Try references
  src.references.forEach(function (item) {
    if (item.name && item.name.length > 1) {
      titles.push(item.name);
    }
  });

  // Pick longest title
  if (titles.length > 0) {
    titles.sort(function (a, b) { return b.length - a.length; });

    return htmlEncode.htmlEncode(titles[0]);
  } else {
    // Fallback to id
    return htmlEncode.htmlEncode(result._id);
  }
}

function get_description(result) {
  // Use highlights, if available
  if (result.highlight) {
    if (result.highlight.content) {
      return result.highlight.content[0];
    }

    if (result.highlight["links.Name"]) {
      // Reference name matching
      return "Links to &ldquo;"+result.highlight["links.Name"][0]+"&rdquo;";
    }

    if (result.highlight["links.Hash"]) {
      // Reference name matching
      return "Links to &ldquo;"+result.highlight["links.Hash"][0]+"&rdquo;";
    }
  }

  var metadata = result._source.metadata;
  if (metadata) {
    // Description, if available
    if (metadata.description) {
      return htmlEncode.htmlEncode(
        downsize(metadata.description[0], {
          "characters": result_description_length, "append": "..."
        })
      );
    }

  }

  // Default to nothing
  return null;
}

function transform_results(results) {
  var hits = [];

  results.hits.forEach(function (item) {
    hits.push({
      "hash": item._id,
      "title": get_title(item),
      "description": get_description(item),
      "type": item._type,
      "size": item._source.size,
      "first-seen": item._source['first-seen'],
      "last-seen": item._source['last-seen']
    });
  });

  // Overwrite existing list of hits
  results.hits = hits;
}

module.exports = transform_results;
