import { expect } from "chai";
import { DocType, DocSubtype, SearchQuery } from "@ipfs-search/api-types";
import { QueryTransformer } from "../../../../src/search/transform/query/query.js";

// import { default as makeDebug } from "debug";
// const debug = makeDebug("ipfs-search:test");

const types: { types: DocSubtype[]; query: string }[] = [
  // With random stuff around content type filter
  {
    types: [DocSubtype.Image],
    query: "random other metadata.Content-Type:(image*) stuff",
  },
  { types: [DocSubtype.Audio], query: "metadata.Content-Type:(audio*)" },
  { types: [DocSubtype.Video], query: "metadata.Content-Type:(video*)" },
  // Both audio and video
  {
    types: [DocSubtype.Video, DocSubtype.Audio],
    query: "metadata.Content-Type:(audio*) metadata.Content-Type:(video*)",
  },
  {
    types: [DocSubtype.Document],
    query:
      "metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword)",
  },
  {
    types: [
      DocSubtype.Unknown,
      DocSubtype.Archive,
      DocSubtype.Data,
      DocSubtype.Other,
    ],
    query:
      "NOT metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword OR audio* OR video* OR image*)",
  },
];

describe("QueryTransformer", function () {
  let transformer: QueryTransformer;

  before(function () {
    transformer = new QueryTransformer();
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  types.forEach(function (type) {
    // eslint-disable-next-line mocha/no-setup-in-describe
    describe(`${type.types} query`, function () {
      let transformed: SearchQuery;
      let query: SearchQuery;

      before(function () {
        query = {
          type: DocType.File,
          query: type.query,
          page: 0,
        };
        transformed = transformer.TransformQuery(query);
      });

      it("is changed", function () {
        expect(transformed).to.not.equal(type);
      });

      it("with correct subtypes", function () {
        expect(transformed.subtypes).to.have.members(type.types);
      });

      it("without content types", function () {
        expect(transformed.query).to.not.contain(type.query);
      });
    });
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  [DocType.File, DocType.Directory].forEach(function (t) {
    describe(`generic ${t} query`, function () {
      let query: SearchQuery;
      let transformed: SearchQuery;

      before(function () {
        query = {
          type: t,
          query: "NOT fiesta AND ford fantasico last-seen:[ now/d-30d TO *]",
          page: 0,
        };
        transformed = transformer.TransformQuery(query);
      });

      it("isn't changed", function () {
        expect(transformed).to.equal(query);
      });
    });
  });
});
