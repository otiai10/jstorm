import { TypeCheckFunc } from "./base";

/**
 * dictTypeChecker is a generagor function of type checker
 * with assuming the value is a dictionary object of given type.
 *
 * @param {TypeCheckFunc} checkValue
 * @return {TypeCheckFunc}
 */
export function dictTypeChecker(
    checkValue: TypeCheckFunc
): TypeCheckFunc {
    const checkRoot = (required, rootValue, rootName): null => {
      if (typeof rootValue === 'undefined') {
        if (required) {
          throw new Error(`${rootName} is marked as required but undefined`);
        }
        return null;
      }
      if (rootValue.constructor !== Object) {
        throw new Error(
            `${rootName} is supposed to be a dictionary` +
            `but ${rootValue.constructor.name}`,
        );
      }
      Object.keys(rootValue).map((key) => {
        checkValue(rootValue[key], `${rootName}[${key}]`);
      });
      return null;
    };
    const check = checkRoot.bind(null, false);
    check.isRequired = checkRoot.bind(null, true);
    if (typeof checkValue.ref === 'function') {
      check.ref = checkValue.ref;
      check.load = (raw = {}) => Object.keys(raw).reduce((prev, key) => {
        if (typeof checkValue.load == "function") {
            prev[key] = checkValue.load(raw[key]);
        } // TODO: Exception handling
        return prev;
      }, {});
    }
    return check;
  };