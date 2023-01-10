import type { TypeCheckFunc } from "./base";

/**
 * createTypeChecker generates a simple type checker.
 * This function is ONLY used internally,
 * and users can use the generated type checker functions.
 *
 * @param {string} typename the name of expected type
 *                represented by "typeof" function.
 * @param {function} validate the validator function for this typename.
 * @return {TypeCheckFunc}
 */
export function createPrimitiveTypeChecker(
    typename: string,
    validatefunc: (value) => boolean,
): TypeCheckFunc {
    // checkType is the base framework function of validation.
    // @param {boolean} required specifies if this property is required OR NOT.
    // @param {any} value the actual value of this property.
    // @param {string} name the name of this property inside the Model.
    // @return {null}
    const checkType = (required, value, name): null => {
        if (typeof value === 'undefined') {
            if (required) {
                throw new Error(`${name} is marked as required`);
            } else {
                return null;
            }
        }
        if (!validatefunc(value)) {
            throw new Error(`${name} is not ${typename}`);
        }
        return null;
    };

    // This `checker` is the actual function users can use.
    // Users can switch `required` OR NOT just by accessing `.isRequired` property
    // of this generated function.
    const checker = checkType.bind(null, false);
    checker.isRequired = checkType.bind(null, true);
    return checker;
}