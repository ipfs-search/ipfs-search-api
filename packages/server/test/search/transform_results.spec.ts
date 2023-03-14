import { CID } from "multiformats";
import { strict as assert } from "node:assert";
import {
  DocSubtype,
  DocType,
  SearchResult,
  SearchResultList,
} from "@ipfs-search/api-types";
import type {
  SearchHit,
  SearchHitsMetadata,
} from "@opensearch-project/opensearch/api/types.js";
import { expect, use } from "chai";
import type { Reference, Source } from "../../src/search/source.js";
import { ResultTransformer } from "../../src/search/transform_results.js";
import chaiDateTime from "chai-datetime";

use(chaiDateTime);

describe("ResultTransformer", function () {
  let transformer: ResultTransformer, doctype: [DocType, DocSubtype?];

  before(function () {
    const aliasResolver = {
      GetDocType: async () => doctype,
    };
    transformer = new ResultTransformer(aliasResolver);
  });

  describe("no results", function () {
    let results: SearchResultList;

    before(async function () {
      const hits: SearchHitsMetadata<Source> = {
        total: 0,
        max_score: 0,
        hits: [],
      };

      results = await transformer.TransformHits(hits);
    });

    it("gives empty results back", function () {
      expect(results.total).to.equal(0);
      expect(results.maxScore).to.equal(0);
      expect(results.hits).to.be.empty;
    });
  });

  describe("directory results", function () {
    let results: SearchResultList;
    let hits: SearchHitsMetadata<Source>;

    before(async function () {
      doctype = [DocType.Directory];

      hits = {
        total: 2,
        max_score: 251.90108,
        hits: [
          {
            _index: "ipfs_directories_v9",
            _id: "QmeBoJQzJYVRYwkJpVSpJxjQFDkENJSeMzgmojsraWxjVw",
            _score: 243.59467,
            _source: {
              "first-seen": "2021-11-24T16:17:04Z",
              references: [
                {
                  name: "Happy tree friends",
                  parent_hash:
                    "bafybeid3f46rrnd47bxwq3atut6qh426qpdxrznrtub6kw2fp6ednxsnc4",
                },
                {
                  name: "Happy tree friends",
                  parent_hash:
                    "bafybeid4bbcd4dshthi23rbs5qibmtuihkauvqyght25vy3zg77hbw7bx4",
                },
              ],
              size: 253854,
              "last-seen": "2021-11-24T16:17:04Z",
            },
          },
          {
            _index: "ipfs_directories_v9",
            _id: "QmUhphYCX2nmaXzpKdDrputZY6fQsGuQQjkMvpMe7jQdHA",
            _score: 251.90108,
            _source: {
              "first-seen": "2021-11-05T23:45:10Z",
              references: [
                {
                  name: "Happy Tree Friends",
                  parent_hash:
                    "bafybeih43azva53hx45pvize5ocrjqoase43aejm4642evgquaketildkm",
                },
                {
                  name: "Happy Tree Friends",
                  parent_hash:
                    "bafybeicewgdttvdbzkbuecsymc627mukzx5fjedbym2suwbe47eiigtjte",
                },
              ],
              size: 373488,
              "last-seen": "2021-11-05T23:45:10Z",
            },
          },
        ],
      };

      results = await transformer.TransformHits(hits);
    });

    it("has correct total count, hit count and max score", function () {
      expect(results.total).to.equal(2);
      expect(results.maxScore).to.equal(251.90108);
      expect(results.hits.length).to.equal(2);
    });

    describe("first result", function () {
      let firstResult: SearchResult;
      let firstHit: SearchHit<Source>;

      before(function () {
        assert(results.hits[0] && hits.hits[0]); // Get TypeScript off my back.
        firstResult = results.hits[0];
        firstHit = hits.hits[0];
      });

      it("has correct hash", function () {
        const hash = CID.parse(firstResult.hash);
        expect(hash.version).to.equal(1);
        expect(hash.equals(firstHit._id));
      });

      it("has correct size", function () {
        expect(firstResult.size).to.equal(firstHit._source?.size);
      });

      it("has correct first seen", function () {
        assert(firstResult["first-seen"]);
        assert(typeof firstHit._source?.["first-seen"] === "string");
        expect(firstResult["first-seen"]).to.equalTime(
          new Date(firstHit._source?.["first-seen"])
        );
      });

      it("has correct last seen", function () {
        assert(firstResult["last-seen"]);
        assert(typeof firstHit._source?.["last-seen"] === "string");
        expect(firstResult["last-seen"]).to.equalTime(
          new Date(firstHit._source?.["last-seen"])
        );
      });

      describe("first reference", function () {
        let ref: Reference;
        let hitRef: Reference;

        before(function () {
          assert(firstResult.references && firstResult.references[0]);
          ref = firstResult.references[0];
          assert(firstHit._source?.references[0]);
          hitRef = firstHit._source?.references[0];
        });

        it("has correct parent hash", function () {
          assert(ref.parent_hash);
          const hash = CID.parse(ref.parent_hash);
          expect(hash.version).to.equal(1);
          expect(hash.equals(hitRef.parent_hash));
        });

        it("has correct name", function () {
          expect(ref.name).to.equal(hitRef.name).and.not.to.be.empty;
        });
      });
    });
  });
});
