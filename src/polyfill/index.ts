import type { StorageArea } from "../interface";

/**
 * Wrap any storage interface to `chrome.storage` interface.
 * @param {Storage} // TODO: add more
 * @returns {StorageArea}
 */
export function use(s: Storage): StorageArea {
    return convertWebStorageToChromeStorageArea(s);
}

/**
 * Convert browser's WebStorage to chrome.storage interface.
 * @param {Storage} webstorage LocalStorage or SessionStorage of browsers.
 * @returns {StorageArea}
 */
function convertWebStorageToChromeStorageArea(webstorage: Storage): StorageArea {

    /**
     * getBytesInUse
     */
    function getBytesInUse(keys?: string | string[]): Promise<number>;
    function getBytesInUse(keys: string | string[], callback: (bytesInUse: number) => void): void;
    function getBytesInUse(callback: (bytesInUse: number) => void): void;
    function getBytesInUse(
        a?: string | string[] | { (number): void },
        b?: (number) => void
    ): Promise<number> | void {
        let keys: string[] = [];
        let callback: null | { (number): void } = null;
        if (arguments.length == 0) {
            keys = Object.keys(webstorage);
        } else if (a instanceof Function) {
            callback = a;
        } else if (a instanceof Array) {
            keys = a;
        } else if (a) {
            keys = [a];
        }
        if (b instanceof Function) {
            callback = b;
        }
        const bytesInUse = keys.reduce((total, key) => {
            return total + (key.length) + (webstorage.getItem(key)?.length || 0);
        }, 0);
        if (callback) callback(bytesInUse);
        else return Promise.resolve(bytesInUse);
    }

    /**
     * clear
     */
    function clear(): Promise<void>;
    function clear(callback?: () => void): void;
    function clear(a?: () => void): Promise<void> | void {
        webstorage.clear();
        if (a) a();
        else return Promise.resolve();
    }

    /**
     * set
     */
    function set(items: { [key: string]: any }): Promise<void>;
    function set(items: { [key: string]: any }, callback?: () => void): void;
    function set(items: { [key: string]: any }, callback?: () => void): Promise<void> | void {
        Object.entries(items).map(([key, value]) => webstorage.setItem(key, JSON.stringify(value)));
        if (callback) callback();
        else return Promise.resolve();
    }

    /**
     * remove
     */
    function remove(keys: string | string[]): Promise<void>;
    function remove(keys: string | string[], callback?: () => void): void;
    function remove(keys: string | string[], callback?: () => void): Promise<void> | void {
        (keys instanceof Array ? keys : [keys]).map(key => webstorage.removeItem(key));
        if (callback) callback();
        else return Promise.resolve();
    }

    /**
     * get
     */
    function get(callback: (items: { [key: string]: any }) => void): void;
    function get(keys?: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }>;
    function get(keys: string | string[] | { [key: string]: any } | null, callback: (items: { [key: string]: any }) => void): void;
    function get(
        a?: string | string[] | { [key: string]: any } | null | { (items: { [key: string]: any }): void },
        b?: (items: { [key: string]: any }) => void
    ): Promise<{ [key: string]: any }> | void {
        let keys: string[] = [];
        let callback: null | { (items: { [key: string]: any }): void } = null;
        let defaultvalues: { [key: string]: any } = {};
        if (arguments.length == 0) {
            keys = Object.keys(webstorage);
        } else if (a instanceof Function) {
            keys = Object.keys(webstorage);
            callback = a;
        } else if (a instanceof String) {
            keys = [a as string];
        } else if (a instanceof Array) {
            keys = a;
        } else if (a instanceof Object) {
            defaultvalues = a;
            keys = Object.keys(a);
            if (keys.length == 0) keys = Object.keys(webstorage);
        }
        if (b instanceof Function) {
            callback = b;
        }
        const result: { [key: string]: any } = keys.reduce((ctx, key) => {
            ctx[key] = JSON.parse(webstorage.getItem(key) || "null") || defaultvalues[key] || null;
            return ctx;
        }, {});
        if (callback) callback(result);
        else return Promise.resolve(result);
    }

    /**
     * setAccessLevel
     */
    function setAccessLevel(accessOptions: { accessLevel: chrome.storage.AccessLevel }): Promise<void>;
    function setAccessLevel(accessOptions: { accessLevel: chrome.storage.AccessLevel }, callback: () => void): void;
    function setAccessLevel(opt: { accessLevel: chrome.storage.AccessLevel }, b?: () => void): Promise<void> | void {
        // TODO: Do something
        if (b) b();
        else return Promise.resolve();
    }

    /**
     * getRules
     * FIXME: The bug of @types/chrome
     */
    function getRules(callback: (rules: chrome.events.Rule[]) => void): void;
    function getRules(ruleIdentifiers: string[], callback: (rules: chrome.events.Rule[]) => void): void;
    function getRules(x: string[] | { (rules: chrome.events.Rule[]): void }, y?: (rules: chrome.events.Rule[]) => void): void {
    }

    /**
     * addRules
     * FIXME: The bug of @types/chrome
     */
    function addRules(rules: chrome.events.Rule[], callback?: (rules: chrome.events.Rule[]) => void): void { }

    /**
     * removeRules
     * FIXME: The bug of @types/chrome
     */
    function removeRules(ruleIdentifiers?: string[], callback?: () => void): void;
    function removeRules(callback?: () => void): void;
    function removeRules(x?: string[] | { (): void }, y?: () => void): void { }

    // TODO: Use this event listener and omit events in other functions.
    let __eventListener__: null | { (changes: { [key: string]: chrome.storage.StorageChange }): void } = null;

    return {
        getBytesInUse,
        clear,
        set,
        remove,
        get,
        setAccessLevel,
        onChanged: {
            addListener(callback: (changes: {[key:string]: chrome.storage.StorageChange}) => void) {
                __eventListener__ = callback;
            },
            hasListener(callback: (changes: {[key:string]: chrome.storage.StorageChange}) => void): boolean {
                return __eventListener__ ? __eventListener__ == callback : false;
            },
            hasListeners(): boolean {
                return !!__eventListener__;
            },
            removeListener(callback: (changes: {[key:string]: chrome.storage.StorageChange}) => void) {
                if (!this.hasListener(callback)) return;
                __eventListener__ = null;
            },
            getRules,
            addRules,
            removeRules,
        },
    };
}