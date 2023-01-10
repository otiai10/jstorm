import * as base from "..";
import { StorageArea } from "../interface";

export class Model extends base.Model {
    static override __area__: StorageArea = base.polyfill.use(globalThis.localStorage);
}
export { Types } from "../types";
