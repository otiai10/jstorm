import * as base from "../..";
import { StorageArea } from "../../interface";

export class Model extends base.Model {
    // Guard the global `chrome` reference the same way the base class does
    // (src/model/index.ts), so that merely importing this sub-package outside
    // an extension (node/jsdom) does not throw `ReferenceError: chrome is not
    // defined` at module-evaluation time. The area is resolved lazily at each
    // operation via Model.__area__(); see base class.
    static override _area_: StorageArea = (typeof chrome == "undefined" ? null : chrome.storage?.sync);
}
export { Types } from "../../types";
