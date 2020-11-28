import * as T from "../_internal/effect"
import * as M from "../_internal/managed"
import type { Stream } from "./definitions"
import { foldWhileManagedM } from "./foldWhileManagedM"

/**
 * Executes an effectful fold over the stream of values.
 * Stops the fold early when the condition is not fulfilled.
 *
 * @param cont function which defines the early termination condition
 */
export function foldWhileM<S>(s: S) {
  return (cont: (s: S) => boolean) => <O, R1, E1>(
    f: (s: S, o: O) => T.Effect<R1, E1, S>
  ) => <R, E>(self: Stream<R, E, O>): T.Effect<R & R1, E1 | E, S> =>
    M.use_(foldWhileManagedM(s)(cont)(f)(self), T.succeed)
}
