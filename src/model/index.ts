import type { StorageArea } from "../interface";
import type { TypeCheckFunc } from "../types";

export type Schema = { [key: string]: TypeCheckFunc };

type ModelConstructor<T> = {
    schema: Schema;
    _area_: StorageArea;

    __ns__(): string;
    __rawdict__(): { [key: string]: any };
    _nextID_(ensemble?: { [key: string]: any }): string;

    list<T>(): Promise<T[]>;
    new(props?: any): T;
    _default_?: { [key: string]: any };
};

class IDProvider {
    static _nextID_: (ensemble?: { [key: string]: any }) => string = this.timestampID;
    static timestampID(): string {
        return String(Date.now());
    }
    static sequentialID(ensemble: { [key:string]: any} = {}): string {
        const last = Object.keys(ensemble).map(id => parseInt(id, 10)).sort((prev, next) => (prev < next) ? -1 : 1).pop();
        return String((last || 0) + 1);
    }
}

export class Model extends IDProvider {

    /**
     * _namespace_
     * Overwite this property if you want to uglify / mangle your JS,
     * and set the same name as your Model class.
     * e.g.,
     *     class Player extends Model {
     *         static overwite _namespace_ = "Player";
     *     }
     */
    static _namespace_?: string;

    /**
     * _default_
     * Overwite this property if you want to get some value even when nothing is stored.
     * When some saving operation, like `save` or `create`, has been called,
     * this default records will be stored in your storage as well.
     * e.g.,
     *     class NotificationSetting extends Model {
     *         static overwrite _default_ = {
     *             "daytime": {
     *               enabled: true,
     *             },
     *             "nighttime": {
     *               enabled: false,
     *             },
     *         }
     *     }
     *
     *     const setting = NotificationSetting.find("nighttime");
     *     setting?.enabled; // true, even if nothing is stored!!
     */
    static _default_?: { [_id: string]: any };

    /**
     * _area_
     * Overwrite this proeprty if you want to use your custom storage.
     * e.g.,
     *     class Player extends Model {
     *         static overwrite _area_ = chrome.storage.session;
     *     }
     *
     * You ain't need it because you can just use followings to embed
     * standard storage interfaces.
     *
     *     // For chrome.storage.local,
     *     import { Model } from "jstorm/chrome/local";
     *
     *     // For chrome.storage.sync,
     *     import { Model } from "jstorm/chrome/sync";
     *
     *     // For window.localStorage,
     *     import { Model } from "jstorm/browser/local";
     *
     *     // For window.sessionStorage,
     *     import { Model } from "jstorm/browser/session";
     */
    static _area_: StorageArea = chrome?.storage?.local;

    /**
     * schema
     * Overwite this property to spacify validation and relation rules of this Model.
     * Please check https://github.com/otiai10/jstorm#schema for more detail.
     */
    static schema: Schema = {};


    /**
     * @private Strictly internal
     */
    static __ns__<T>(this: ModelConstructor<T>): string {
        return this["__namespace__"] ?? this.name;
    }

    /**
     * @private Strictly internal
     */
    static async __rawdict__<T>(this: ModelConstructor<T>): Promise<{ [key: string]: any }> {
        const namespace: string = this.__ns__();
        const ensemble = await this._area_.get(namespace);
        return ensemble?.[namespace] || this._default_ || {};
    }

    static useStorage(area: StorageArea) {
        this._area_ = area;
    }

    static new<T>(this: ModelConstructor<T>, props?: Record<string, any>, _id?: string): T {
        const instance: T = new this(props);
        instance["_id"] = _id ?? null;
        Object.entries<any>(props || {}).map(([key, value]) => {
            instance[key] = value;
        });
        return instance;
    }

    static async create<T>(this: ModelConstructor<T>, props?: Record<string, any>): Promise<T> {
        return await this["new"](props).save();
    }

    static async list<T>(this: ModelConstructor<T>): Promise<T[]> {
        const dict = await this.__rawdict__();
        const res: T[] = [];
        for (let id in dict) {
            const instance = this["new"](dict[id], id) as Model;
            await instance.__decode__(dict[id]);
            res.push(instance as T);
        }
        return res;
    }

    static async filter<T>(this: ModelConstructor<T>, func: (v: T, i?: number, arr?: T[]) => boolean): Promise<T[]> {
        return (await this.list()).filter<T>(func as any);
    }

    static async find<T>(this: ModelConstructor<T>, id: string): Promise<T | null> {
        const dict = await this.__rawdict__();
        const entry = dict[id] || this._default_?.[id] || null;
        if (!entry) return null;
        const instance = this["new"](entry, id) as Model;
        await instance.__decode__(dict[id]);
        return instance as T;
    }

    static async drop<T>(this: ModelConstructor<T>): Promise<void> {
        await this._area_.set({ [this.__ns__()]: {} });
        return;
    }

    public _id: string | null;

    async save<T>(this: T & Model): Promise<T> {
        const parent = (this.constructor as ModelConstructor<T>);
        const dict = await parent.__rawdict__();
        if (!this._id) this._id = parent._nextID_(dict);
        dict[this._id!] = this;
        await parent._area_.set({ [parent.__ns__()]: dict });
        return this;
    }

    async delete<T>(this: T & Model): Promise<T> {
        const parent = (this.constructor as ModelConstructor<T>);
        const dict = await parent.__rawdict__();
        delete dict[this._id];
        await parent._area_.set({ [parent.__ns__()]: dict });
        delete this._id;
        return this;
    }

    async update<T>(this: T & Model, props: Record<string, any>): Promise<T> {
        Object.keys(props).map(key => {
            if (this.hasOwnProperty(key)) this[key] = props[key];
        });
        return this.save();
    }

    /**
     * Strictly internal
     * @param {Object} raw
     * @returns {Promise<T>}
     */
    async __decode__<T>(this: T & Model, raw: { [prop: string]: any }): Promise<T> {
        const { schema } = (this.constructor as ModelConstructor<T>);
        for (let key in schema) {
            if (!this.hasOwnProperty(key)) continue;
            if (!raw.hasOwnProperty(key)) continue;
            if (typeof schema[key].load == "function") {
                this[key] = await schema[key].load(raw[key]);
            } else {
                this[key] = raw[key];
            }
        }
        return this;
    }

}
