// tracing: off

/**
 * Copyright 2020 Michael Arnaldi and the Matechs Garage Contributors.
 */
import { accessCallTrace, traceAs, traceFrom } from "@effect-ts/tracing-utils"

import * as A from "../Array"
import * as R from "../Dictionary"
import {
  access,
  accessM,
  chain_,
  effectTotal,
  provideAll_,
  succeed,
  suspend
} from "../Effect/core"
import type { Effect } from "../Effect/effect"
import type { Has, Tag } from "../Has"
import { mergeEnvironments } from "../Has"
import type { UnionToIntersection } from "../Utils"

/**
 * Access a record of services with the required Service Entries
 */
export function accessServicesM<SS extends Record<string, Tag<any>>>(s: SS) {
  return (
    /**
     * @trace 0
     */
    <R = unknown, E = never, B = unknown>(
      f: (
        a: {
          [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
        }
      ) => Effect<R, E, B>
    ) =>
      accessM(
        traceAs(
          f,
          (
            r: UnionToIntersection<
              {
                [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : unknown
              }[keyof SS]
            >
          ) => f(R.map_(s, (v) => r[v.key]) as any)
        )
      )
  )
}

/**
 * Access a tuple of services with the required Service Entries monadically
 */
export function accessServicesTM<SS extends Tag<any>[]>(...s: SS) {
  return (
    /**
     * @trace 0
     */
    <R = unknown, E = never, B = unknown>(
      f: (
        ...a: {
          [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
        }
      ) => Effect<R, E, B>
    ) =>
      accessM(
        traceAs(
          f,
          (
            r: UnionToIntersection<
              {
                [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : never
              }[keyof SS & number]
            >
          ) => f(...(A.map_(s, (v) => r[v.key]) as any))
        )
      )
  )
}

/**
 * Access a tuple of services with the required Service Entries
 */
export function accessServicesT<SS extends Tag<any>[]>(...s: SS) {
  return (
    /**
     * @trace 0
     */
    <B = unknown>(
      f: (
        ...a: {
          [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
        }
      ) => B
    ) =>
      access(
        traceAs(
          f,
          (
            r: UnionToIntersection<
              {
                [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : never
              }[keyof SS & number]
            >
          ) => f(...(A.map_(s, (v) => r[v.key]) as any))
        )
      )
  )
}

/**
 * Access a record of services with the required Service Entries
 */
export function accessServices<SS extends Record<string, Tag<any>>>(s: SS) {
  return (
    /**
     * @trace 0
     */
    <B>(
      f: (
        a: {
          [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
        }
      ) => B
    ) =>
      access(
        traceAs(
          f,
          (
            r: UnionToIntersection<
              {
                [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : unknown
              }[keyof SS]
            >
          ) => f(R.map_(s, (v) => r[v.key]) as any)
        )
      )
  )
}

/**
 * Access a service with the required Service Entry
 */
export function accessServiceM<T>(s: Tag<T>) {
  return (
    /**
     * @trace 0
     */
    <R, E, B>(f: (a: T) => Effect<R, E, B>) =>
      accessM(traceAs(f, (r: Has<T>) => f(r[s.key as any])))
  )
}

/**
 * Access a service with the required Service Entry
 */
export function accessService<T>(s: Tag<T>) {
  return (
    /**
     * @trace 0
     */
    <B>(f: (a: T) => B) => accessServiceM(s)(traceAs(f, (a) => succeed(f(a))))
  )
}

/**
 * Accesses the specified service in the environment of the effect.
 *
 * @trace call
 */
export function service<T>(s: Tag<T>) {
  const trace = accessCallTrace()
  return accessServiceM(s)(traceFrom(trace, (a) => succeed(a)))
}

/**
 * Accesses the specified services in the environment of the effect.
 *
 * @trace call
 */
export function services<Ts extends readonly Tag<any>[]>(...s: Ts) {
  const trace = accessCallTrace()
  return access(
    traceAs(
      trace,
      (
        r: UnionToIntersection<
          { [k in keyof Ts]: [Ts[k]] extends [Tag<infer T>] ? Has<T> : never }[number]
        >
      ): Readonly<{ [k in keyof Ts]: [Ts[k]] extends [Tag<infer T>] ? T : never }> =>
        s.map((tag) => tag.read(r as any)) as any
    )
  )
}

/**
 * Provides the service with the required Service Entry
 */
export function provideServiceM<T>(_: Tag<T>) {
  return <R, E>(f: Effect<R, E, T>) => <R1, E1, A1>(
    ma: Effect<R1 & Has<T>, E1, A1>
  ): Effect<R & R1, E | E1, A1> =>
    accessM((r: R & R1) =>
      chain_(f, (t) => provideAll_(ma, mergeEnvironments(_, r, t)))
    )
}

/**
 * Provides the service with the required Service Entry
 */
export function provideService<T>(_: Tag<T>) {
  return (f: T) => <R1, E1, A1>(ma: Effect<R1 & Has<T>, E1, A1>): Effect<R1, E1, A1> =>
    provideServiceM(_)(succeed(f))(ma)
}

/**
 * Replaces the service with the required Service Entry
 */
export function replaceServiceM<R, E, T>(_: Tag<T>, f: (_: T) => Effect<R, E, T>) {
  return <R1, E1, A1>(
    ma: Effect<R1 & Has<T>, E1, A1>
  ): Effect<R & R1 & Has<T>, E | E1, A1> =>
    accessServiceM(_)((t) => provideServiceM(_)(f(t))(ma))
}

/**
 * Replaces the service with the required Service Entry
 *
 * @trace 2
 */
export function replaceServiceM_<R, E, T, R1, E1, A1>(
  ma: Effect<R1 & Has<T>, E1, A1>,
  _: Tag<T>,
  f: (_: T) => Effect<R, E, T>
): Effect<R & R1 & Has<T>, E | E1, A1> {
  return accessServiceM(_)((t) =>
    provideServiceM(_)(suspend(traceAs(f, () => f(t))))(ma)
  )
}

/**
 * Replaces the service with the required Service Entry
 *
 * @dataFirst replaceService_
 * @trace 1
 */
export function replaceService<T>(_: Tag<T>, f: (_: T) => T) {
  return <R1, E1, A1>(ma: Effect<R1 & Has<T>, E1, A1>): Effect<R1 & Has<T>, E1, A1> =>
    replaceService_(ma, _, f)
}

/**
 * Replaces the service with the required Service Entry
 *
 * @trace 2
 */
export function replaceService_<R1, E1, A1, T>(
  ma: Effect<R1 & Has<T>, E1, A1>,
  _: Tag<T>,
  f: (_: T) => T
): Effect<R1 & Has<T>, E1, A1> {
  return accessServiceM(_)((t) =>
    provideServiceM(_)(effectTotal(traceAs(f, () => f(t))))(ma)
  )
}
