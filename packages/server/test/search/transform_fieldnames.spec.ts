import { DocType, SearchQuery } from "@ipfs-search/api-types";
import TransformMetadataFieldNames from "../../src/search/transform_fieldnames.js";
import { expect } from "chai";

describe("TransformMetadataFieldNames", function () {
  it("should transform metadata.title to metadata.dc:title", function () {
    const q: SearchQuery = {
      query: 'metadata.title:"title of book"',
      type: DocType.File,
      page: 0,
    };
    const transformed = TransformMetadataFieldNames(q);
    expect(transformed.query).to.deep.equal(
      'metadata.dc\\:title:"title of book"'
    );
  });

  it("should transform multiple metadata fields", function () {
    const q: SearchQuery = {
      query:
        "some general query metadata.language:(en OR nl) more words type:file subtype:audio metadata.height:>500",
      type: DocType.File,
      page: 0,
    };
    const transformed = TransformMetadataFieldNames(q);
    expect(transformed.query).to.deep.equal(
      "some general query metadata.dc\\:language:(en OR nl) more words type:file subtype:audio metadata.tiff\\:ImageLength:>500"
    );
  });

  it("should not transform non-metadata queries", function () {
    const q: SearchQuery = {
      query: "some general query",
      type: DocType.File,
      page: 0,
    };
    const transformed = TransformMetadataFieldNames(q);
    expect(transformed).to.deep.equal(q);
  });

  it("should also work when 'type' is 'any'", function () {
    const q: SearchQuery = {
      query: 'metadata.title:"title of book"',
      type: "any",
      page: 0,
    };
    const transformed = TransformMetadataFieldNames(q);
    expect(transformed.query).to.deep.equal(
      'metadata.dc\\:title:"title of book"'
    );
  });
});
