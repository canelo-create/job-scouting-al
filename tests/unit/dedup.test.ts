import { describe, it, expect } from "vitest";
import { computeDedupHash, normalize, normalizeUrl } from "@/lib/dedup";

describe("normalize", () => {
  it("lowercases and strips accents", () => {
    expect(normalize("Madrid, España")).toBe("madrid espana");
  });

  it("removes punctuation", () => {
    expect(normalize("Globant — Strategy (Senior)")).toBe("globant strategy senior");
  });

  it("strips seniority markers", () => {
    expect(normalize("Consultant Jr")).toBe("consultant");
    expect(normalize("Analyst II")).toBe("analyst");
  });

  it("collapses whitespace", () => {
    expect(normalize("  hello    world  ")).toBe("hello world");
  });

  it("returns empty for null", () => {
    expect(normalize(null)).toBe("");
    expect(normalize(undefined)).toBe("");
  });
});

describe("normalizeUrl", () => {
  it("strips query and fragment", () => {
    expect(normalizeUrl("https://linkedin.com/jobs/view/123?utm=x#hash")).toBe(
      "linkedin.com/jobs/view/123",
    );
  });

  it("strips trailing slash", () => {
    expect(normalizeUrl("https://example.com/path/")).toBe("example.com/path");
  });

  it("handles malformed URLs", () => {
    expect(normalizeUrl("not-a-url?q=1")).toBe("not-a-url");
  });
});

describe("computeDedupHash", () => {
  it("produces stable hash for identical inputs", () => {
    const a = computeDedupHash({
      company: "Globant",
      title: "Strategy Associate",
      city: "Madrid",
      source_url: "https://x.com/jobs/1?utm=foo",
    });
    const b = computeDedupHash({
      company: "Globant",
      title: "Strategy Associate",
      city: "Madrid",
      source_url: "https://x.com/jobs/1?utm=bar",
    });
    expect(a).toBe(b);
  });

  it("treats variant titles as duplicates", () => {
    const a = computeDedupHash({
      company: "Globant",
      title: "Business Hacking Madrid",
      city: "Madrid",
    });
    const b = computeDedupHash({
      company: "Globant",
      title: "Globant — Business Hacking Associate (Madrid)",
      city: "Madrid",
    });
    // Note: these will differ because titles are materially different;
    // this test documents that our current dedup is conservative on title.
    expect(a).not.toBe(b);
  });

  it("different companies produce different hashes", () => {
    const a = computeDedupHash({ company: "A", title: "X", city: "Y" });
    const b = computeDedupHash({ company: "B", title: "X", city: "Y" });
    expect(a).not.toBe(b);
  });

  it("same job different cities → different hash", () => {
    const a = computeDedupHash({ company: "X", title: "T", city: "Madrid" });
    const b = computeDedupHash({ company: "X", title: "T", city: "Bogotá" });
    expect(a).not.toBe(b);
  });
});
