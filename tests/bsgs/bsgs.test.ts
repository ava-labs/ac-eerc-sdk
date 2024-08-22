import fs from "node:fs";
import path from "node:path";
import { BabyJub } from "../../src/crypto/babyjub";
import { BSGS } from "../../src/crypto/bsgs";
import { FF } from "../../src/crypto/ff";
import { IndexedDBStorage } from "../../src/helpers";
import { SNARK_FIELD_SIZE } from "../../src/utils";

jest.mock("../../src/helpers", () => ({
  IndexedDBStorage: jest.fn().mockImplementation(() => ({
    getTable: jest.fn().mockImplementation(() => {
      const p = path.join(__dirname, "data", "lookup_table.json");
      const f = fs.readFileSync(p, "utf-8");
      return JSON.parse(f);
    }),
    saveTable: jest.fn(),
  })),
  logMessage: jest.fn(),
}));

describe("BSGS", () => {
  let bsgs: BSGS;
  let tableUrl: string;
  let curve: BabyJub;
  let storage: IndexedDBStorage;

  beforeEach(() => {
    tableUrl = "http://example.com/table";
    storage = new IndexedDBStorage();

    const ff = new FF(SNARK_FIELD_SIZE);
    curve = new BabyJub(ff);
    bsgs = new BSGS(tableUrl, curve, storage);
  });

  test("should initialize properly", async () => {
    expect(bsgs).not.toBeUndefined();
  });

  describe("initialize", () => {
    test("if table is not initialized should fetch", async () => {
      storage.getTable = jest.fn().mockResolvedValue(null);
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => ({
            aa: 1,
          }),
        }),
      ) as jest.Mock;
      await bsgs.initialize();

      expect(storage.getTable).toHaveBeenCalled();

      // fetch have been called
      expect(global.fetch).toHaveBeenCalledWith(tableUrl);
      expect(storage.saveTable).toHaveBeenCalledWith({ aa: 1 });
    });

    test("if table is initialized should recover", async () => {
      storage.getTable = jest.fn().mockResolvedValue({ aa: 1 });
      await bsgs.initialize();

      expect(storage.getTable).toHaveBeenCalled();
      expect(storage.saveTable).not.toHaveBeenCalled();
    });
  });

  describe("find", () => {
    it("should find properly (minimal case)", async () => {
      await bsgs.initialize();
      const expected = 10n;
      const point = curve.mulWithScalar(curve.Base8, expected);

      const now = performance.now();
      const result = await bsgs.find(point);
      const later = performance.now();
      console.log("Time taken (minimal): ", later - now, "ms");

      expect(result).toBe(expected);
    });

    it("should find properly (larger case)", async () => {
      await bsgs.initialize();
      const expected = 2_000_000_000n;
      const point = curve.mulWithScalar(curve.Base8, expected);

      const startTime = performance.now();
      const result = await bsgs.find(point);
      const endTime = performance.now();
      console.log("Time taken (larger): ", endTime - startTime, "ms");

      expect(result).toBe(expected);
    });
  });
});
