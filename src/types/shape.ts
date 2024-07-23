import type { TypeCheckFunc } from "./base";

/**
 * shapeTypeChecker is a generator function of type checker
 * with checking each element of the object.
 *
 * @param {Record<string, TypeCheckFunc>} validations is a dictionary
 *        to map which TypeCheckFunc is used to which property.
 * @return {TypeCheckFunc}
 */
export function shapeTypeChecker(
    validations: { [key: string]: TypeCheckFunc } = {},
): TypeCheckFunc {
  const checkRoot = (required, rootValue, rootName): null => {
    if (typeof rootValue === 'undefined') {
      if (required) {
        throw new Error(`${rootName} is marked as required`);
      } else {
        return null;
      }
    }
    Object.keys(validations).map((fieldName) => {
      const validation = validations[fieldName];
      const value = rootValue[fieldName];
      validation(value, fieldName);
    });
    return null;
  };
  const check = checkRoot.bind(null, false);
  check.isRequired = checkRoot.bind(null, true);
  // TODO: load?
  return check;
};