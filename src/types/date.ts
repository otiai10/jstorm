import { TypeCheckFunc } from "./base";

export function createDateTypeChecker(): TypeCheckFunc {
    const checkType = (required: boolean, value: any, name: string): null => {
        if (typeof value === 'undefined') {
            if (required) {
                throw new Error(`${name} is marked as required, but got undefined`);
            }
            return null;
        }
        if (
            typeof value.constructor === 'function' &&
            value.constructor.name === 'Date'
        ) {
            return null;
        }
        throw new Error(
            `${name} is supposed to be Date, but got ${value.constructor.name}`,
        );
    };
    const check = checkType.bind(null, false);
    check.isRequired = checkType.bind(null, true);
    check.load = (raw) => new Date(raw);
    return check;
};
