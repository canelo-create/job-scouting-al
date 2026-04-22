import { describe, it, expect } from "vitest";
import { runwayDays, runwayTone } from "@/lib/constants";

describe("runwayDays", () => {
  it("returns positive days when target is in the future", () => {
    const target = new Date("2026-12-31T00:00:00Z");
    const from = new Date("2026-01-01T00:00:00Z");
    expect(runwayDays(target, from)).toBe(364);
  });

  it("counts ~88 days from 2026-04-23 to 2026-07-20 (real runway)", () => {
    const target = new Date("2026-07-20T00:00:00Z");
    const from = new Date("2026-04-23T00:00:00Z");
    expect(runwayDays(target, from)).toBe(88);
  });

  it("returns 0 when target has passed", () => {
    const target = new Date("2020-01-01T00:00:00Z");
    const from = new Date("2026-01-01T00:00:00Z");
    expect(runwayDays(target, from)).toBe(0);
  });

  it("handles same-day as 0", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    expect(runwayDays(date, date)).toBe(0);
  });
});

describe("runwayTone", () => {
  it("returns 'ok' when far from deadline", () => {
    expect(runwayTone(120)).toBe("ok");
    expect(runwayTone(61)).toBe("ok");
  });

  it("returns 'warn' in middle range", () => {
    expect(runwayTone(60)).toBe("warn");
    expect(runwayTone(45)).toBe("warn");
    expect(runwayTone(31)).toBe("warn");
  });

  it("returns 'danger' when close", () => {
    expect(runwayTone(30)).toBe("danger");
    expect(runwayTone(1)).toBe("danger");
    expect(runwayTone(0)).toBe("danger");
  });
});
