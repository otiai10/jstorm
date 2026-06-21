/// <reference path="../node_modules/@types/chrome/index.d.ts" />

import { Model } from "../src/model";
import { MemoryStorageArea, installMemoryStorage, withStorage } from "../src/testing";

/**
 * Regression + contract suite for jstorm Issue #64:
 *   - importing `jstorm/chrome/*` outside an extension must not crash
 *   - operating without a configured area must fail with an actionable message
 *   - the in-memory test double must match the `chrome.storage.StorageArea` contract
 *
 * NOTE: jest.setup.ts installs `global.chrome` (storage.local only), so tests
 * that need a "no chrome" world delete it inside an isolated module registry
 * and restore it afterwards.
 */

describe("Issue #64 — import-time chrome guard", () => {

    // AC-1: import without `chrome` must not throw `ReferenceError`.
    it("AC-1: importing chrome/local & chrome/sync with chrome undefined does not throw", () => {
        const saved = (globalThis as any).chrome;
        delete (globalThis as any).chrome;
        try {
            expect(() => {
                jest.isolateModules(() => {
                    require("../src/chrome/local");
                    require("../src/chrome/sync");
                });
            }).not.toThrow();
        } finally {
            (globalThis as any).chrome = saved;
        }
    });

    // AC-3: inside an extension context, the sub-packages still resolve to the
    // matching chrome.storage area (no regression).
    it("AC-3: chrome/local resolves to chrome.storage.local when chrome is present", () => {
        let area: any;
        jest.isolateModules(() => {
            area = require("../src/chrome/local").Model._area_;
        });
        expect(area).toBe(chrome.storage.local);
    });

    it("AC-3: chrome/sync resolves to chrome.storage.sync when chrome is present", () => {
        const sync = { __isSyncStub__: true };
        (chrome.storage as any).sync = sync;
        try {
            let area: any;
            jest.isolateModules(() => {
                area = require("../src/chrome/sync").Model._area_;
            });
            expect(area).toBe(sync);
        } finally {
            delete (chrome.storage as any).sync;
        }
    });
});

describe("Issue #64 — actionable error when unconfigured", () => {

    // AC-2: operating with no area throws a readable message, not a null deref.
    it("AC-2: find() without a configured area throws an actionable error", async () => {
        class Unconfigured extends Model {}
        Unconfigured.useStorage(null as any);
        await expect(Unconfigured.find("anything")).rejects.toThrow(
            /jstorm: no StorageArea configured/,
        );
    });

    it("AC-2: save() without a configured area throws an actionable error", async () => {
        class Unconfigured2 extends Model { public name: string; }
        Unconfigured2.useStorage(null as any);
        await expect(Unconfigured2.new({ name: "x" }).save()).rejects.toThrow(
            /Call Model\.useStorage\(\.\.\.\)/,
        );
    });
});

describe("Issue #64 — 1-line in-memory swap (AC-4)", () => {

    it("AC-4: Model.useStorage(installMemoryStorage()) runs the async chrome-like path", async () => {
        class Town extends Model { public name: string; }
        Town.useStorage(installMemoryStorage());

        const t = await Town.create({ name: "Springfield" });
        expect(t._id).not.toBeNull();

        const found = await Town.find(t._id!);
        expect(found?.name).toBe("Springfield");

        expect(await Town.list()).toHaveLength(1);
    });

    it("AC-4: installMemoryStorage(seed) pre-populates records", async () => {
        class Seeded extends Model {
            static override _namespace_ = "Seeded";
            public name: string;
        }
        Seeded.useStorage(installMemoryStorage({ Seeded: { "1": { name: "Jack" } } }));
        const found = await Seeded.find("1");
        expect(found?.name).toBe("Jack");
    });

    it("AC-4: withStorage scopes the swap and restores the previous area", async () => {
        class City extends Model { public name: string; }
        const before = (City as any)._area_;
        await withStorage(City as any, installMemoryStorage(), async () => {
            await City.create({ name: "Gotham" });
            expect(await City.list()).toHaveLength(1);
        });
        expect((City as any)._area_).toBe(before);
    });
});

describe("Issue #64 — MemoryStorageArea ↔ chrome.storage contract (AC-5)", () => {

    let area: MemoryStorageArea;
    beforeEach(() => { area = new MemoryStorageArea(); });

    it("get() and get(null) return all items", async () => {
        await area.set({ a: 1, b: 2 });
        expect(await area.get()).toEqual({ a: 1, b: 2 });
        expect(await area.get(null)).toEqual({ a: 1, b: 2 });
    });

    it("get(string) returns {key: value}; absent key is omitted", async () => {
        await area.set({ a: 1 });
        expect(await area.get("a")).toEqual({ a: 1 });
        expect(await area.get("missing")).toEqual({});
    });

    it("get(array) projects requested keys; absent keys omitted", async () => {
        await area.set({ a: 1, b: 2, c: 3 });
        expect(await area.get(["a", "c", "nope"])).toEqual({ a: 1, c: 3 });
    });

    it("get(object) applies defaults for absent keys", async () => {
        await area.set({ a: 1 });
        expect(await area.get({ a: 0, b: 9 })).toEqual({ a: 1, b: 9 });
    });

    it("set merges, remove deletes (string & array), clear empties", async () => {
        await area.set({ a: 1, b: 2 });
        await area.set({ b: 3, c: 4 });
        expect(await area.get(null)).toEqual({ a: 1, b: 3, c: 4 });
        await area.remove("a");
        expect(await area.get(null)).toEqual({ b: 3, c: 4 });
        await area.remove(["b", "c"]);
        expect(await area.get(null)).toEqual({});
        await area.set({ x: 1 });
        await area.clear();
        expect(await area.get(null)).toEqual({});
    });

    it("preserves value types and deep-clones (no reference leakage)", async () => {
        const nested = { n: 1, arr: [1, 2], o: { k: "v" } };
        await area.set({ d: nested });
        nested.n = 999;
        nested.arr.push(3);
        const got = await area.get("d");
        expect(got.d).toEqual({ n: 1, arr: [1, 2], o: { k: "v" } });
        expect(typeof got.d.n).toBe("number");
    });

    it("every operation returns a Promise (same await path as production)", () => {
        expect(area.get(null)).toBeInstanceOf(Promise);
        expect(area.set({ a: 1 })).toBeInstanceOf(Promise);
        expect(area.remove("a")).toBeInstanceOf(Promise);
        expect(area.clear()).toBeInstanceOf(Promise);
    });

    // Parity on the exact access path jstorm uses (get(namespaceString)), against
    // the repository's built-in chrome.storage mock. The mock is intentionally
    // minimal (it does not implement get(null)=all), which is itself why a
    // dedicated, contract-tested double is needed — see Issue #64.
    it("matches the chrome.storage mock on jstorm's get(namespace) path", async () => {
        await chrome.storage.local.clear();
        const payload = { Player: { "1": { name: "Jack", age: 17 } } };
        await chrome.storage.local.set(payload);
        const mem = new MemoryStorageArea();
        await mem.set(payload);

        const fromMock = await chrome.storage.local.get("Player");
        const fromMem = await mem.get("Player");

        expect(fromMem.Player).toEqual(payload.Player);
        expect(fromMem.Player).toEqual(fromMock.Player);
    });
});
