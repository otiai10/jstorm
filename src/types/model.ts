import type { Model } from "../model";
import type { TypeCheckFunc } from "./base";

/**
 * ModelTypeOption can specify the options of reference type.
 */
export interface ModelTypeOption {
    /**
     * eager:
     *  If it's true, methods like `find` will try to load
     *  the newest data for the referenced models.
     *  Otherwise the referenced models will be just decoded class instances
     *  stored under this parent's namespace.
     */
    eager?: boolean;
}


/**
 * referenceTypeChecker is a generator function of type checker
 * with referencing another Model, known as "relations".
 * The generated type checker function also includes "decode" function
 * so that the referenced peoperties can be decoded
 * at the same time on decoding the root model.
 *
 * @param {function} refConstructor
 * @param {ReferenceTypeOption} opt
 * @return {TypeCheckFunc}
 */
export function modelTypeChecker(
    refConstructor: typeof Model,
    opt: ModelTypeOption = {},
): TypeCheckFunc {
  const checkRoot = (
      required: boolean,
      value: Model,
      refName: string,
  ): null => {
    if (typeof value === 'undefined') {
      if (required) {
        throw new Error(`${refName} is marked as required`);
      } else {
        return null;
      }
    }
    // TODO: value._validate();
    return null;
  };
  const check = checkRoot.bind(null, false);
  check.isRequired = checkRoot.bind(null, true);
  // To decode this property as a Model, store the constructor here.
  check.ref = refConstructor;
  check.load = async (rawObject) => {
    if (!opt.eager) {
      const instance = check.ref["new"](rawObject, rawObject["_id"]);
      await instance.__decode__(rawObject);
      return instance;
    }
    if (!rawObject) {
      return;
    }
    if (typeof rawObject._id === 'undefined') {
      return;
    }
    return await check.ref.find(rawObject._id);
  };
  check.isRequired.load = check.load;
  return check;
};