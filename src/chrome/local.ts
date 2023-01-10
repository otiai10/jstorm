import * as base from "..";
import { StorageArea } from "../interface";

export class Model extends base.Model {
    static override __area__: StorageArea = chrome.storage.local;
}
export { Types } from "../types";
