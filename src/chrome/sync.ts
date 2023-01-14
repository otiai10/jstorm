import * as base from "..";
import { StorageArea } from "../interface";

export class Model extends base.Model {
    static override _area_: StorageArea = chrome.storage.sync;
}
export { Types } from "../types";
