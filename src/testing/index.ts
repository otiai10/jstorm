import type { StorageArea } from "../interface";

/**
 * jstorm/testing
 *
 * Test helpers for exercising Model logic outside an extension (node/jsdom)
 * without hand-rolling a `chrome` mock. `MemoryStorageArea` mirrors the async
 * `chrome.storage.StorageArea` shape, so tests run the same `await` path as
 * production `chrome.storage`.
 *
 *     import { Model } from "jstorm/chrome/local";
 *     import { installMemoryStorage } from "jstorm/testing";
 *
 *     beforeEach(() => Model.useStorage(installMemoryStorage()));
 */

type Dict = { [key: string]: any };

/**
 * Deep clone via JSON, matching how `chrome.storage` (and jstorm's WebStorage
 * polyfill) serialize values. This isolates stored data from later mutations of
 * the caller's objects, just like the real backend does.
 */
function clone<T>(value: T): T {
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/**
 * MemoryStorageArea
 * An in-memory test double with the same async surface jstorm uses on
 * `chrome.storage.StorageArea`. Every operation returns a Promise.
 *
 * Mirrors `chrome.storage` `get` semantics:
 *   - get() / get(null)      -> all items
 *   - get("key")             -> { key: value } (key omitted when absent)
 *   - get(["a", "b"])        -> projection (absent keys omitted)
 *   - get({ a: 1, b: 2 })    -> stored value, or the given default when absent
 */
export class MemoryStorageArea {

    private data: Dict;

    constructor(seed: Dict = {}) {
        this.data = clone(seed) || {};
    }

    async get(keys?: string | string[] | Dict | null): Promise<Dict> {
        if (keys === undefined || keys === null) return clone(this.data);
        const out: Dict = {};
        if (typeof keys === "string") {
            if (keys in this.data) out[keys] = clone(this.data[keys]);
        } else if (Array.isArray(keys)) {
            keys.forEach(key => { if (key in this.data) out[key] = clone(this.data[key]); });
        } else {
            Object.keys(keys).forEach(key => {
                out[key] = (key in this.data) ? clone(this.data[key]) : clone(keys[key]);
            });
        }
        return out;
    }

    async set(items: Dict): Promise<void> {
        Object.assign(this.data, clone(items));
    }

    async remove(keys: string | string[]): Promise<void> {
        (Array.isArray(keys) ? keys : [keys]).forEach(key => { delete this.data[key]; });
    }

    async clear(): Promise<void> {
        this.data = {};
    }

    async getKeys(): Promise<string[]> {
        return Object.keys(this.data);
    }
}

/**
 * installMemoryStorage
 * Create a fresh in-memory StorageArea, optionally seeded. Designed to be
 * dropped straight into `Model.useStorage`:
 *
 *     Model.useStorage(installMemoryStorage());
 *     Model.useStorage(installMemoryStorage({ Player: { "1": { name: "Jack" } } }));
 *
 * To reset between tests, install a fresh one (or call `area.clear()`).
 */
export function installMemoryStorage(seed: Dict = {}): StorageArea {
    return new MemoryStorageArea(seed) as unknown as StorageArea;
}

/** Minimal structural view of a Model class: enough to swap its storage area. */
interface StorageHost {
    _area_: StorageArea;
    useStorage(area: StorageArea): void;
}

/**
 * withStorage
 * Run `fn` with `model` temporarily bound to `area`, restoring the previous
 * area afterwards (even if `fn` throws). Keeps parallel/sequential tests from
 * leaking a swapped storage backend into one another.
 *
 *     await withStorage(Player, installMemoryStorage(), async () => {
 *         await Player.create({ name: "Jack" });
 *     });
 */
export async function withStorage<T>(
    model: StorageHost,
    area: StorageArea,
    fn: () => Promise<T> | T,
): Promise<T> {
    const previous = model._area_;
    model.useStorage(area);
    try {
        return await fn();
    } finally {
        model.useStorage(previous);
    }
}
