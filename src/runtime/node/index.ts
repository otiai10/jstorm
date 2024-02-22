
import * as base from "../..";
import * as polyfill from "../../polyfill";
import { StorageArea } from "../../interface";
import { OnMemoryStorage } from "../onmemory";

export class Model extends base.Model {
    static override _area_: StorageArea = polyfill.use(new OnMemoryStorage());
}

export { Types } from "../../types";
