import * as base from "..";
import * as polyfill from "../polyfill";
import { StorageArea } from "../interface";

export class Model extends base.Model {
    static override __area__: StorageArea = polyfill.use(globalThis.sessionStorage);
}
export { Types } from "../types";
