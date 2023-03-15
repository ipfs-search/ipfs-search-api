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

  describe("document results", function () {
    let results: SearchResultList;
    let hits: SearchHitsMetadata<Source>;

    before(async function () {
      doctype = [DocType.File, DocSubtype.Document];

      hits = {
        total: 4,
        max_score: 251.90108,
        hits: [
          {
            _index: "ipfs_documents_v1",
            _id: "viQY6YMJeJUg6mNiPnYvcOAXyKw",
            _score: 44.856483,
            _source: {
              "first-seen": "2021-03-04T03:01:08Z",
              metadata: {
                "dc:title": ["bananas"],
                "dc:creator": ["python-docx"],
                "dcterms:created": ["2023-01-03T12:35:22Z"],
                "Content-Type": ["application/pdf"],
              },
              references: [],
              size: 9463,
              "last-seen": "2021-12-18T04:24:31Z",
              cid: "bafkreichryw5ih5pkrcctwfc6hz3jtvui22i6r5gjnfoxlqceppxkbrnyy",
            },
          },
          // The same, but with no metadata and nothing to give a title.
          {
            _index: "ipfs_documents_v1",
            _id: "viQY6YMJeJUg6mNiPnYvcOAXyKw",
            _score: 44.856483,
            _source: {
              "first-seen": "2021-03-04T03:01:08Z",
              references: [
                {
                  // CID names won't get used as title.
                  name: "bafybeid3f46rrnd47bxwq3atut6qh426qpdxrznrtub6kw2fp6ednxsnc4",
                  parent_hash:
                    "bafybeid3f46rrnd47bxwq3atut6qh426qpdxrznrtub6kw2fp6ednxsnc4",
                },
              ],
              size: 9463,
              "last-seen": "2021-12-18T04:24:31Z",
              cid: "bafkreichryw5ih5pkrcctwfc6hz3jtvui22i6r5gjnfoxlqceppxkbrnyy",
            },
          },
          // Description and highlight.
          {
            _index: "ipfs_documents_v1",
            _id: "RsFLD1/t1+bXVVvZwUFKsAmX4kI",
            _score: 6.2701306,
            _source: {
              metadata: {
                "dc:description": [
                  "PII can be included in attachments which are included in events.  Minidumps , a common attachment type for native crash reports, may contain PII in various sect",
                ],
                // Very long title, should be shortened.
                "dc:title": [
                  "Attachment Scrubbing | Sentry Documentation PII can be included in attachments which are included in events.",
                ],
                "Content-Type": ["text/html; charset=UTF-8"],
              },
              references: [],
              cid: "bafybeifd2ywsjllvpxhpkng5omx6ncuoiglebjtlp7gpnhwn2rcu6zr53y",
            },
            highlight: {
              "metadata.dc:description": [
                "Sensitive information,Personally identifiable information (<em>PII</em>),Anonymous information,Self-concept,Private&#x2F;public self,Consumer privacy,Digital privacy",
              ],
            },
          },
          // Title from reference.
          {
            _index: "ipfs_documents_v1",
            _id: "viQY6YMJeJUg6mNiPnYvcOAXyKw",
            _score: 44.856483,
            _source: {
              references: [
                {
                  name: "Happy",
                  parent_hash:
                    "bafybeid3f46rrnd47bxwq3atut6qh426qpdxrznrtub6kw2fp6ednxsnc4",
                },
              ],
              cid: "bafybeifd2ywsjllvpxhpkng5omx6ncuoiglebjtlp7gpnhwn2rcu6zr53y",
            },
          },
        ],
      };

      results = await transformer.TransformHits(hits);
    });

    describe("typical result", function () {
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
        expect(hash.equals(firstHit._source?.cid));
      });

      it("has correct title", function () {
        assert(Array.isArray(firstHit._source?.metadata?.["dc:title"]));
        expect(firstResult.title).to.equal(
          firstHit._source?.metadata?.["dc:title"][0]
        );
      });
    });

    describe("result without metadata", function () {
      let result: SearchResult;
      // let hit: SearchHit<Source>;

      before(function () {
        assert(results.hits[1] && hits.hits[1]); // Get TypeScript off my back.
        result = results.hits[1];
        // hit = hits.hits[1];
      });

      it("has no title", function () {
        expect(result.title).to.be.undefined;
      });

      it("has no mime type", function () {
        expect(result.mimetype).to.be.undefined;
      });
    });

    describe("result with description highlight", function () {
      let result: SearchResult;
      let hit: SearchHit<Source>;

      before(function () {
        assert(results.hits[2] && hits.hits[2]); // Get TypeScript off my back.
        result = results.hits[2];
        hit = hits.hits[2];
      });

      it("has correct title", function () {
        assert(Array.isArray(hit._source?.metadata?.["dc:title"]));
        expect(result.title).to.equal(hit._source?.metadata?.["dc:title"][0]);
      });

      it("description based on highlight", function () {
        assert(Array.isArray(hit.highlight?.["metadata.dc:description"]));
        expect(result.description).to.equal(
          hit.highlight?.["metadata.dc:description"][0]
        );
      });
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
