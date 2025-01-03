/**
 *  Throws an EthersError with %%message%%, %%code%% and additional error
 *  %%info%% when %%check%% is falsish..
 *
 *  @see [[api:makeError]]
 */
export function assert(check: unknown, message: string, code, info?): asserts check {
  // eslint-disable-next-line no-throw-literal
  if (!check) { throw('Assertion error') }
}


/**
 *  A simple helper to simply ensuring provided arguments match expected
 *  constraints, throwing if not.
 *
 *  In TypeScript environments, the %%check%% has been asserted true, so
 *  any further code does not need additional compile-time checks.
 */
export function assertArgument(check: unknown, message: string, name: string, value: unknown): asserts check {
  assert(check, message, "INVALID_ARGUMENT", { argument: name, value });
}
