import * as T from "../../Effect"
import * as M from "../../Managed"
import * as O from "../../Option"
import type { Stream } from "./definitions"

/**
   * Executes an effectful fold over the stream of values.
   * Returns a Managed value that represents the scope of the stream.
   * Stops the fold early when the condition is not fulfilled.

   * @param cont function which defines the early termination condition
   */
export function foldWhileManagedM<S>(s: S) {
  return (cont: (s: S) => boolean) => <O, R1, E1>(
    f: (s: S, o: O) => T.Effect<R1, E1, S>
  ) => <R, E>(self: Stream<R, E, O>): M.Managed<R & R1, E1 | E, S> =>
    M.chain_(self.proc, (is) => {
      const loop = (s1: S): T.Effect<R & R1, E | E1, S> => {
        if (!cont(s1)) {
          return T.succeed(s1)
        } else {
          return T.foldM_(
            is,
            O.fold(
              () => T.succeed(s1),
              (e) => T.fail(e)
            ),
            // TODO: Check with mike, using ch.foldM(s1)(f)
            (ch) => T.chain_(T.reduce_(ch, s1, f), loop)
          )
        }
      }

      return M.fromEffect(loop(s))
    })
}
