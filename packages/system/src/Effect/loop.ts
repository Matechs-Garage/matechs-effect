// tracing: off

import { pipe } from "../Function"
import * as L from "../Persistent/List"
import * as core from "./core"
import type { Effect } from "./effect"
import * as map from "./map"

/**
 * Loops with the specified effectual function, collecting the results into a
 * list. The moral equivalent of:
 *
 * ```
 * let s  = initial
 * let as = [] as readonly A[]
 *
 * while (cont(s)) {
 *   as = [body(s), ...as]
 *   s  = inc(s)
 * }
 *
 * A.reverse(as)
 * ```
 */
export function loop<Z>(initial: Z, cont: (z: Z) => boolean, inc: (z: Z) => Z) {
  return <R, E, A>(
    body: (z: Z) => Effect<R, E, A>,
    __trace?: string
  ): Effect<R, E, readonly A[]> => {
    return map.map_(loopInternal_(initial, cont, inc, body, __trace), (x) =>
      Array.from(L.reverse(x))
    )
  }
}

function loopInternal_<Z, R, E, A>(
  initial: Z,
  cont: (z: Z) => boolean,
  inc: (z: Z) => Z,
  body: (z: Z) => Effect<R, E, A>,
  __trace?: string
): Effect<R, E, L.MutableList<A>> {
  return core.suspend(() => {
    if (cont(initial)) {
      return core.chain_(body(initial), (a) =>
        pipe(
          loopInternal_(inc(initial), cont, inc, body),
          map.map((as) => {
            L.push(a, as)
            return as
          })
        )
      )
    }
    return core.effectTotal(() => L.emptyPushable())
  }, __trace)
}

/**
 * Loops with the specified effectual function purely for its effects. The
 * moral equivalent of:
 *
 * ```
 * var s = initial
 *
 * while (cont(s)) {
 *   body(s)
 *   s = inc(s)
 * }
 * ```
 */
export function loopUnit<Z>(initial: Z, cont: (z: Z) => boolean, inc: (z: Z) => Z) {
  return <R, E, X>(
    body: (z: Z) => Effect<R, E, X>,
    __trace?: string
  ): Effect<R, E, void> => {
    return core.suspend(() => {
      if (cont(initial)) {
        return core.chain_(body(initial), () => loopUnit(inc(initial), cont, inc)(body))
      }
      return core.unit
    }, __trace)
  }
}
