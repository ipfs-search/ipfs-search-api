import { strict as assert } from "node:assert";
import GetSubTypes from "../../../../src/search/transform/query/subtypes.js";
import { expect } from "chai";
import { DocSubtype, DocType, SearchQuery } from "@ipfs-search/api-types";

describe("GetSubTypes", function () {
  let typeMapping: Record<string, DocSubtype[]>;

  before(function () {
    typeMapping = {
      "metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword)":
        [DocSubtype.Document],
      "metadata.Content-Type:(audio*)": [DocSubtype.Audio],
      "metadata.Content-Type:(video*)": [DocSubtype.Video],
      "metadata.Content-Type:(image*)": [DocSubtype.Image],
      "NOT metadata.Content-Type:(application/x-mobipocket-ebook OR application/epub+zip OR application/vnd.amazon.ebook OR image/vnd.djvu OR application/pdf OR text/html* OR text/x-html* OR text/plain* OR text/*markdown* OR application/postscript OR application/rtf OR application/vnd.oasis.opendocument.text OR application/vnd.sun.xml.writer OR application/vnd.stardivision.writer OR application/x-starwriter OR application/msword OR application/vnd.openxmlformats-officedocument.wordprocessingml.document OR application/vnd.ms-powerpoint OR application/vnd.openxmlformats-officedocument.presentationml.presentation OR application/vnd.oasis.opendocument.presentation OR application/vnd.ms-excel OR application/vnd.openxmlformats-officedocument.spreadsheetml.sheet OR application/vnd.oasis.opendocument.spreadsheet OR text/csv OR application/x-abiword OR audio* OR video* OR image*)":
        [
          DocSubtype.Archive,
          DocSubtype.Unknown,
          DocSubtype.Data,
          DocSubtype.Other,
        ],
    };
  });

  it("should match types from typemapping", function () {
    for (const [k, v] of Object.entries(typeMapping)) {
      const q: SearchQuery = {
        type: DocType.File,
        page: 0,
        query: k,
      };
      const newq = GetSubTypes(q);

      // Expect elements from v to match elemens from newq.subtypes
      // and vice versa.
      assert(newq.subtypes);
      expect(newq.subtypes).to.have.members(v);
      expect(v).to.have.members(newq.subtypes);
    }
  });

  it("should remove matching content types from query", function () {
    for (const [k] of Object.entries(typeMapping)) {
      const q: SearchQuery = {
        type: DocType.File,
        page: 0,
        query: k,
      };
      const newq = GetSubTypes(q);

      // Expect k to not be a substring of newq.query.
      expect(newq.query).to.not.include(k);
    }
  });

  it("should allow multiple matches (e.g. audio AND video) subtypes", function () {
    const q: SearchQuery = {
      type: DocType.File,
      page: 0,
      query:
        "metadata.Content-Type:(audio*) AND metadata.Content-Type:(video*)",
    };
    const newq = GetSubTypes(q);
    expect(newq.subtypes).to.have.members([DocSubtype.Audio, DocSubtype.Video]);
  });

  it("should be empty if none match", function () {
    const q: SearchQuery = {
      type: DocType.File,
      page: 0,
      query: "metadata.Content-Type:(application/zip)",
    };
    const newq = GetSubTypes(q);
    expect(newq.subtypes).to.be.undefined;
  });

  it("should change the query also when type is 'any'", function () {
    const q: SearchQuery = {
      type: "any",
      page: 0,
      query: "metadata.Content-Type:(audio*)",
    };
    const newq = GetSubTypes(q);
    expect(newq.query).to.be.empty;
    expect(newq.subtypes).to.have.members([DocSubtype.Audio]);
  });

  it("should not change the query when type is DocType.Directory", function () {
    const q: SearchQuery = {
      type: DocType.Directory,
      page: 0,
      query: "metadata.Content-Type:(audio*)",
    };
    const newq = GetSubTypes(q);
    expect(newq.query).to.equal(q.query);
    expect(newq.subtypes).to.be.undefined;
  });
});
