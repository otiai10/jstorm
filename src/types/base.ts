import { Model } from "../model";

export declare interface TypeCheckFunc {
    (value: any, name: string): null;
    isRequired?: TypeCheckFunc;

    // For recursive reference
    load?: (value: any) => any;
    ref?: typeof Model;
}
