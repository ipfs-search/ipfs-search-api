import { strict as assert } from "node:assert";
import { DocType, SearchQuery } from "@ipfs-search/api-types";
import { MetadataField } from "../../documentfields.js";

function getMetadataFieldMapping(): Record<string, string> {
  const m: Record<string, MetadataField> = {
    title: MetadataField.Title,
    description: MetadataField.Descripton,
    width: MetadataField.Width,
    height: MetadataField.Height,
    language: MetadataField.Language,
    subject: MetadataField.Descripton,
  };

  // Escaping ':' in resulting field names.
  return Object.fromEntries(
    Object.entries(m).map(([k, v]) => [k, v.replace(":", "\\:")])
  );
}

const metadataFieldMapping = getMetadataFieldMapping();
const metadataFieldNames = Object.keys(metadataFieldMapping);
const metadataFieldRegex = new RegExp(
  `metadata\\.(${metadataFieldNames.join("|")})`,
  "g"
);

export default function TransformMetadataFieldNames(
  q: SearchQuery
): SearchQuery {
  if (
    !([DocType.File, "any"].includes(q.type) && q.query.includes("metadata"))
  ) {
    return q;
  }

  const transformedQuery = q.query.replace(metadataFieldRegex, (_match, p1) => {
    const field: string | undefined = metadataFieldMapping[p1];
    assert(field, `Unknown metadata field: ${p1}`);
    return `metadata.${field}`;
  });

  return {
    ...q,
    query: transformedQuery,
  };
}
