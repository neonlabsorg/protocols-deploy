import { assertArgument } from "./errors";

/**
 *  A [[HexString]] whose length is even, which ensures it is a valid
 *  representation of binary data.
 */
export type DataHexString = string;

/**
 *  An object that can be used to represent binary data.
 */
export type BytesLike = DataHexString | Uint8Array;

/**
 *  An RLP-encoded structure.
 */
export type RlpStructuredData = string | Array<RlpStructuredData>;

/**
 *  An RLP-encoded structure, which allows Uint8Array.
 */
export type RlpStructuredDataish = string | Uint8Array | Array<RlpStructuredDataish>;

const HexCharacters: string = "0123456789abcdef";

/**
 *  Returns a [[DataHexString]] representation of %%data%%.
 */
export function hexlify(data: BytesLike): string {
  const bytes = getBytes(data);

  let result = "0x";
  for (let i = 0; i < bytes.length; i++) {
    const v = bytes[i];
    // eslint-disable-next-line no-bitwise
    result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
  }
  return result;
}

// eslint-disable-next-line consistent-return
function _getBytes(value: BytesLike, name?: string, copy?: boolean): Uint8Array {
  if (value instanceof Uint8Array) {
    if (copy) { return new Uint8Array(value); }
    return value;
  }

  if (typeof(value) === "string" && value.match(/^0x(?:[0-9a-f][0-9a-f])*$/i)) {
    const result = new Uint8Array((value.length - 2) / 2);
    let offset = 2;
    for (let i = 0; i < result.length; i++) {
      result[i] = parseInt(value.substring(offset, offset + 2), 16);
      offset += 2;
    }
    return result;
  }

  assertArgument(false, "invalid BytesLike value", name || "value", value);
}

/**
 *  Get a typed Uint8Array for %%value%%. If already a Uint8Array
 *  the original %%value%% is returned; if a copy is required use
 *  [[getBytesCopy]].
 *
 *  @see: getBytesCopy
 */
export function getBytes(value: BytesLike, name?: string): Uint8Array {
  return _getBytes(value, name, false);
}