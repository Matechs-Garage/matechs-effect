import type { Effect } from "../Effect"
import { ISuspend } from "../Effect/primitives"
import { identity } from "../Function"

/**
 * Marks f with the specified trace
 */
export function traceF_<F extends Function>(f: F, _trace: string): F {
  const g = ((...args: any[]) => f(...args)) as any
  g["$trace"] = _trace
  return g
}

/**
 * Trace F as the first of inputs
 */
export function traceAs(...refs: any[]) {
  switch (arguments.length) {
    case 1: {
      if ("$trace" in refs[0]) {
        return <F extends Function>(f: F): F => {
          const g = ((...args: any[]) => f(...args)) as any
          g["$trace"] = refs[0]["$trace"]
          return g
        }
      }
      return identity
    }
    default: {
      let trace: undefined | string = undefined
      for (let i = 0; i < refs.length; i++) {
        if (refs[i] && "$trace" in refs[i]) {
          trace = refs[i]["$trace"]
          i = refs.length
        }
      }
      if (trace) {
        return <F extends Function>(f: F): F => {
          const g = ((...args: any[]) => f(...args)) as any
          g["$trace"] = trace
          return g
        }
      }
      return identity
    }
  }
}

/**
 * Trace self using suspend
 */
export function traceSuspend(trace: string) {
  return <R, E, A>(self: Effect<R, E, A>): Effect<R, E, A> =>
    new ISuspend(traceF_(() => self, trace))
}