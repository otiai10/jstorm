import type { TypeCheckFunc } from "./base";

// export function arrayOfTypeChecker<T>(
export function arrayOfTypeChecker(
    typ: TypeCheckFunc,
): TypeCheckFunc {
    const checkRoot = (
        required: boolean,
        value: TypeCheckFunc,
        refName: string,
    ): null => {
        return null;
    }
    const check = checkRoot.bind(null, false);
    check.isRequired = checkRoot.bind(null, true);
    check.load = async (rawArray) => {
        if (rawArray instanceof Array == false) {
            return [];
        }
        const res: any[] = [];
        for (let v of rawArray) {
            if (typeof typ.load == "function") {
                res.push(await typ.load(v));
            } else {
                res.push(v)
            }
        }
        // return res as T[];
        return res;
    }
    return check;
}