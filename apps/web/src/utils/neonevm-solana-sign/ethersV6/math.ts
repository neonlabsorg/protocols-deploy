import { assert, assertArgument } from "./errors";

/**
 *  Any type that can be used where a numeric value is needed.
 */
export type Numeric = number | bigint;

/**
 *  Any type that can be used where a big number is needed.
 */
export type BigNumberish = string | Numeric;

const BN_0 = BigInt(0);
const BN_1 = BigInt(1);

// IEEE 754 support 53-bits of mantissa
const maxValue = 0x1fffffffffffff;

/**
 *  Gets a BigInt from %%value%%. If it is an invalid value for
 *  a BigInt, then an ArgumentError will be thrown for %%name%%.
 */
// eslint-disable-next-line consistent-return
export function getBigInt(value: BigNumberish, name?: string): bigint {
  // eslint-disable-next-line default-case
  switch (typeof(value)) {
    case "bigint": return value;
    case "number":
      assertArgument(Number.isInteger(value), "underflow", name || "value", value);
      assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
      return BigInt(value);
    case "string":
      try {
        if (value === "") { throw new Error("empty string"); }
        if (value[0] === "-" && value[1] !== "-") {
          return -BigInt(value.substring(1));
        }
        return BigInt(value);
      } catch(e: any) {
        assertArgument(false, `invalid BigNumberish string: ${ e.message }`, name || "value", value);
      }
  }
  assertArgument(false, "invalid BigNumberish value", name || "value", value);
}

/**
 *  Gets a //number// from %%value%%. If it is an invalid value for
 *  a //number//, then an ArgumentError will be thrown for %%name%%.
 */
// eslint-disable-next-line consistent-return
export function getNumber(value: BigNumberish, name?: string): number {
  // eslint-disable-next-line default-case
  switch (typeof(value)) {
    case "bigint":
      assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
      return Number(value);
    case "number":
      assertArgument(Number.isInteger(value), "underflow", name || "value", value);
      assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
      return value;
    case "string":
      try {
        if (value === "") { throw new Error("empty string"); }
        return getNumber(BigInt(value), name);
      } catch(e: any) {
        assertArgument(false, `invalid numeric string: ${ e.message }`, name || "value", value);
      }
  }
  assertArgument(false, "invalid numeric value", name || "value", value);
}

/**
 *  Returns %%value%% as a bigint, validating it is valid as a bigint
 *  value and that it is positive.
 */
export function getUint(value: BigNumberish, name?: string): bigint {
  const result = getBigInt(value, name);
  // @ts-ignore
  assert(result >= BN_0, "unsigned value cannot be negative", "NUMERIC_FAULT", {
    fault: "overflow", operation: "getUint", value
  });
  return result;
}

/**
 *  Converts %%value%% to a Big Endian hexstring, optionally padded to
 *  %%width%% bytes.
 */
export function toBeHex(_value: BigNumberish, _width?: Numeric): string {
  const value = getUint(_value, "value");

  let result = value.toString(16);

  if (_width == null) {
    // Ensure the value is of even length
    if (result.length % 2) { result = `0${  result}`; }
  } else {
    const width = getNumber(_width, "width");
    // @ts-ignore
    assert(width * 2 >= result.length, `value exceeds width (${ width } bytes)`, "NUMERIC_FAULT", {
      operation: "toBeHex",
      fault: "overflow",
      value: _value
    });

    // Pad the value to the required width
    while (result.length < (width * 2)) { result = "0" + result; }

  }

  return "0x" + result;
}