// tracing: off

import * as C from "../Cause/core"
import { FiberFailure } from "../Cause/errors"
import * as A from "../Collections/Immutable/Array"
import * as Tp from "../Collections/Immutable/Tuple"
import * as E from "../Either"
import type { FiberID } from "../Fiber/id"
import { identity, pipe } from "../Function"
import * as O from "../Option"
import type { Exit } from "./exit"
import { Failure, Success } from "./exit"

export { Exit, Failure, Success } from "./exit"

/**
 * Applicative's ap
 */
export function ap_<E, A, B>(fa: Exit<E, A>, fab: Exit<E, (a: A) => B>): Exit<E, B> {
  return chain_(fab, (f) => map_(fa, (a) => f(a)))
}

/**
 * Applicative's ap
 *
 * @dataFirst ap_
 */
export function ap<E, A>(fa: Exit<E, A>) {
  return <B>(fab: Exit<E, (a: A) => B>): Exit<E, B> => ap_(fa, fab)
}

/**
 * Replaces the success value with the one provided.
 */
export function as_<E, B>(exit: Exit<E, unknown>, b: B) {
  return map_(exit, () => b)
}

/**
 * Replaces the success value with the one provided.
 *
 * @dataFirst as_
 */
export function as<B>(b: B) {
  return <E>(exit: Exit<E, unknown>) => as_(exit, b)
}

/**
 * Maps over both the error and value type.
 */
export function bimap_<E, E1, A, A1>(
  exit: Exit<E, A>,
  f: (e: E) => E1,
  g: (a: A) => A1
) {
  return pipe(exit, map(g), mapError(f))
}

/**
 * Maps over both the error and value type.
 *
 * @dataFirst bimap_
 */
export function bimap<E, E1, A, A1>(f: (e: E) => E1, g: (a: A) => A1) {
  return (exit: Exit<E, A>) => bimap_(exit, f, g)
}

/**
 * Flat maps over the value type.
 */
export function chain_<E, A, A1, E1>(
  exit: Exit<E, A>,
  f: (a: A) => Exit<E1, A1>
): Exit<E | E1, A1> {
  switch (exit._tag) {
    case "Failure": {
      return exit
    }
    case "Success": {
      return f(exit.value)
    }
  }
}

/**
 * Flat maps over the value type.
 *
 * @dataFirst chain_
 */
export function chain<A, A1, E1>(f: (a: A) => Exit<E1, A1>) {
  return <E>(exit: Exit<E, A>): Exit<E | E1, A1> => chain_(exit, f)
}

/**
 * Collects all the success states and merges sequentially the causes
 */
export function collectAll<E, A>(
  ...exits: readonly Exit<E, A>[]
): O.Option<Exit<E, readonly A[]>> {
  return pipe(
    A.head(exits),
    O.map((head) =>
      pipe(
        A.dropLeft_(exits, 1),
        A.reduce(
          pipe(
            head,
            map((x): readonly A[] => [x])
          ),
          (acc, el) =>
            pipe(
              acc,
              zipWith(el, (acc, el) => [el, ...acc], C.then)
            )
        ),
        map(A.reverse)
      )
    )
  )
}

/**
 * Zips this together with the specified result using the combination functions.
 */
export function zipWith_<E, E1, A, B, C>(
  exit: Exit<E, A>,
  that: Exit<E1, B>,
  f: (a: A, b: B) => C,
  g: (e: C.Cause<E>, e1: C.Cause<E1>) => C.Cause<E | E1>
): Exit<E | E1, C> {
  switch (exit._tag) {
    case "Failure": {
      switch (that._tag) {
        case "Success": {
          return exit
        }
        case "Failure": {
          return halt(g(exit.cause, that.cause))
        }
      }
    }
    // eslint-disable-next-line no-fallthrough
    case "Success": {
      switch (that._tag) {
        case "Success": {
          return succeed(f(exit.value, that.value))
        }
        case "Failure": {
          return that
        }
      }
    }
  }
}

/**
 * Zips this together with the specified result using the combination functions.
 *
 * @dataFirst zipWith_
 */
export function zipWith<E, E1, A, B, C>(
  that: Exit<E1, B>,
  f: (a: A, b: B) => C,
  g: (e: C.Cause<E>, e1: C.Cause<E1>) => C.Cause<E | E1>
) {
  return (exit: Exit<E, A>): Exit<E | E1, C> => zipWith_(exit, that, f, g)
}

/**
 * Collects all the success states and merges the causes in parallel
 */
export function collectAllPar<E, A>(
  ...exits: readonly Exit<E, A>[]
): O.Option<Exit<E, readonly A[]>> {
  return pipe(
    A.head(exits),
    O.map((head) =>
      pipe(
        A.dropLeft_(exits, 1),
        A.reduce(
          pipe(
            head,
            map((x): readonly A[] => [x])
          ),
          (acc, el) =>
            pipe(
              acc,
              zipWith(el, (acc, el) => [el, ...acc], C.both)
            )
        ),
        map(A.reverse)
      )
    )
  )
}

/**
 * Construct an Exit with an unchecked cause containing the specified error
 */
export function die(error: unknown) {
  return halt(C.die(error))
}

/**
 * Returns f(a) if the exit is successful
 */
export function exists_<A, E>(exit: Exit<E, A>, f: (a: A) => boolean): boolean {
  return pipe(
    exit,
    fold(() => false, f)
  )
}

/**
 * Returns f(a) if the exit is successful
 *
 * @dataFirst exists_
 */
export function exists<A>(f: (a: A) => boolean) {
  return <E>(exit: Exit<E, A>): boolean => exists_(exit, f)
}

/**
 * Constructs a failed exit with the specified checked error
 */
export function fail<E>(e: E) {
  return halt(C.fail(e))
}

/**
 * Flatten nested Exits
 */
export function flatten<E, E1, A>(exit: Exit<E, Exit<E1, A>>) {
  return pipe(exit, chain(identity))
}

/**
 * Folds over the value or cause.
 */
export function fold_<E, A, Z>(
  exit: Exit<E, A>,
  failed: (e: C.Cause<E>) => Z,
  succeed: (a: A) => Z
): Z {
  switch (exit._tag) {
    case "Success": {
      return succeed(exit.value)
    }
    case "Failure": {
      return failed(exit.cause)
    }
  }
}

/**
 * Folds over the value or cause.
 *
 * @dataFirst fold_
 */
export function fold<E, A, Z>(failed: (e: C.Cause<E>) => Z, succeed: (a: A) => Z) {
  return (exit: Exit<E, A>): Z => fold_(exit, failed, succeed)
}

/**
 * Embeds Either's Error & Success in an Exit
 */
export function fromEither<E, A>(e: E.Either<E, A>): Exit<E, A> {
  return e._tag === "Left" ? fail(e.left) : succeed(e.right)
}

/**
 * Embeds an option result into an Exit with the specified error using onNone
 */
export function fromOption<E>(onNone: () => E) {
  return <A>(a: O.Option<A>): Exit<E, A> =>
    a._tag === "None" ? fail(onNone()) : succeed(a.value)
}

/**
 * Get successful result falling back to orElse result in case of failure
 */
export function getOrElse_<E, A, A1>(
  exit: Exit<E, A>,
  orElse: (_: C.Cause<E>) => A1
): A | A1 {
  switch (exit._tag) {
    case "Success": {
      return exit.value
    }
    case "Failure": {
      return orElse(exit.cause)
    }
  }
}

/**
 * Get successful result falling back to orElse result in case of failure
 *
 * @dataFirst getOrElse_
 */
export function getOrElse<E, A1>(orElse: (_: C.Cause<E>) => A1) {
  return <A>(exit: Exit<E, A>): A | A1 => getOrElse_(exit, orElse)
}

/**
 * Constructs a failed exit with the specified cause
 */
export function halt<E>(cause: C.Cause<E>): Exit<E, never> {
  return new Failure(cause)
}

/**
 * Constructs an exit with the specified interruption state
 */
export function interrupt(id: FiberID) {
  return halt(C.interrupt(id))
}

/**
 * Returns if Exit contains an interruption state
 */
export function interrupted<E, A>(exit: Exit<E, A>): exit is Failure<E> {
  switch (exit._tag) {
    case "Success": {
      return false
    }
    case "Failure": {
      return C.interrupted(exit.cause)
    }
  }
}

/**
 * Maps over the value type.
 */
export function map_<E, A, A1>(exit: Exit<E, A>, f: (a: A) => A1): Exit<E, A1> {
  return pipe(
    exit,
    chain((a) => succeed(f(a)))
  )
}

/**
 * Maps over the value type.
 *
 * @dataFirst map_
 */
export function map<A, A1>(f: (a: A) => A1) {
  return <E>(exit: Exit<E, A>): Exit<E, A1> => map_(exit, f)
}

/**
 * Maps over the error type.
 */
export function mapError_<E, E1, A>(exit: Exit<E, A>, f: (e: E) => E1): Exit<E1, A> {
  switch (exit._tag) {
    case "Failure": {
      return halt(C.map(f)(exit.cause))
    }
    case "Success": {
      return exit
    }
  }
}

/**
 * Maps over the error type.
 *
 * @dataFirst mapError_
 */
export function mapError<E, E1>(f: (e: E) => E1) {
  return <A>(exit: Exit<E, A>): Exit<E1, A> => mapError_(exit, f)
}

/**
 * Maps over the cause type.
 */
export function mapErrorCause_<E, E1, A>(
  exit: Exit<E, A>,
  f: (e: C.Cause<E>) => C.Cause<E1>
): Exit<E1, A> {
  switch (exit._tag) {
    case "Failure": {
      return halt(f(exit.cause))
    }
    case "Success": {
      return exit
    }
  }
}

/**
 * Maps over the cause type.
 *
 * @dataFirst mapErrorCause_
 */
export function mapErrorCause<E, E1>(f: (e: C.Cause<E>) => C.Cause<E1>) {
  return <A>(exit: Exit<E, A>): Exit<E1, A> => mapErrorCause_(exit, f)
}

/**
 * Replaces the error value with the one provided.
 */
export function orElseFail_<E, E1, A>(exit: Exit<E, A>, e: E1): Exit<E1, A> {
  return pipe(
    exit,
    mapError(() => e)
  )
}

/**
 * Replaces the error value with the one provided.
 *
 * @dataFirst orElseFail_
 */
export function orElseFail<E1>(e: E1) {
  return <E, A>(exit: Exit<E, A>) => orElseFail_(exit, e)
}

/**
 * Construct a succeeded exit with the specified value
 */
export function succeed<A>(a: A): Exit<never, A> {
  return new Success(a)
}

/**
 * Returns if an exit is succeeded
 */
export function succeeded<E, A>(exit: Exit<E, A>): exit is Success<A> {
  switch (exit._tag) {
    case "Failure": {
      return false
    }
    case "Success": {
      return true
    }
  }
}

/**
 * Converts the `Exit` to an `Either<FiberFailure, A>`, by wrapping the
 * cause in `FiberFailure` (if the result is failed).
 */
export function toEither<E, A>(exit: Exit<E, A>): E.Either<FiberFailure<E>, A> {
  switch (exit._tag) {
    case "Success": {
      return E.right(exit.value)
    }
    case "Failure": {
      return E.left(new FiberFailure(exit.cause))
    }
  }
}

/**
 * Discards the value.
 */
export const unit: Exit<never, void> = succeed(undefined)

/**
 * Sequentially zips the this result with the specified result or else returns the failed `Cause[E1]`
 */
export function zip_<E, E1, A, B>(
  exit: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, Tp.Tuple<[A, B]>> {
  return pipe(
    exit,
    zipWith(that, (a, b) => Tp.tuple(a, b), C.then)
  )
}

/**
 * Sequentially zips the this result with the specified result or else returns the failed `Cause[E1]`
 *
 * @dataFirst zip_
 */
export function zip<E1, B>(that: Exit<E1, B>) {
  return <E, A>(exit: Exit<E, A>): Exit<E | E1, Tp.Tuple<[A, B]>> => zip_(exit, that)
}

/**
 * Sequentially zips the this result with the specified result discarding the second element of the tuple or else returns the failed `Cause[E1]`
 */
export function zipLeft_<E, E1, A, B>(
  exit: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, A> {
  return pipe(
    exit,
    zipWith(that, (a, _) => a, C.then)
  )
}

/**
 * Sequentially zips the this result with the specified result discarding the second element of the tuple or else returns the failed `Cause[E1]`
 *
 * @dataFirst zipLeft_
 */
export function zipLeft<E1, B>(that: Exit<E1, B>) {
  return <E, A>(exit: Exit<E, A>): Exit<E | E1, A> => zipLeft_(exit, that)
}

/**
 * Parallelly zips the this result with the specified result or else returns the failed `Cause[E1]`
 */
export function zipPar_<E, E1, A, B>(
  exit: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, Tp.Tuple<[A, B]>> {
  return pipe(
    exit,
    zipWith(that, (a, b) => Tp.tuple(a, b), C.both)
  )
}

/**
 * Parallelly zips the this result with the specified result or else returns the failed `Cause[E1]`
 *
 * @dataFirst zipPar_
 */
export function zipPar<E1, B>(that: Exit<E1, B>) {
  return <E, A>(exit: Exit<E, A>): Exit<E | E1, Tp.Tuple<[A, B]>> => zipPar_(exit, that)
}

/**
 * Parallelly zips the this result with the specified result discarding the second element of the tuple or else returns the failed `Cause[E1]`
 */
export function zipParLeft_<E, E1, A, B>(
  exit: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, A> {
  return pipe(
    exit,
    zipWith(that, (a, _) => a, C.both)
  )
}

/**
 * Parallelly zips the this result with the specified result discarding the second element of the tuple or else returns the failed `Cause[E1]`
 *
 * @dataFirst zipParLeft_
 */
export function zipParLeft<E1, B>(that: Exit<E1, B>) {
  return <E, A>(exit: Exit<E, A>): Exit<E | E1, A> => zipParLeft_(exit, that)
}

/**
 * Parallelly zips the this result with the specified result discarding the first element of the tuple or else returns the failed `Cause[E1]`
 */
export function zipParRight_<E, E1, A, B>(
  exit: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, B> {
  return pipe(
    exit,
    zipWith(that, (_, b) => b, C.both)
  )
}

/**
 * Parallelly zips the this result with the specified result discarding the first element of the tuple or else returns the failed `Cause[E1]`
 *
 * @dataFirst zipParRight_
 */
export function zipParRight<E1, B>(that: Exit<E1, B>) {
  return <E, A>(exit: Exit<E, A>): Exit<E | E1, B> => zipParRight_(exit, that)
}

/**
 * Sequentially zips the this result with the specified result discarding the first element of the tuple or else returns the failed `Cause[E1]`
 */
export function zipRight_<E, A, E1, B>(
  exit: Exit<E, A>,
  that: Exit<E1, B>
): Exit<E | E1, B> {
  return pipe(
    exit,
    zipWith(that, (_, b) => b, C.then)
  )
}

/**
 * Sequentially zips the this result with the specified result discarding the first element of the tuple or else returns the failed `Cause[E1]`
 *
 * @dataFirst zipRight_
 */
export function zipRight<E1, B>(that: Exit<E1, B>) {
  return <E, A>(exit: Exit<E, A>): Exit<E | E1, B> => zipRight_(exit, that)
}

/**
 * Returns an untraced exit value.
 */
export function untraced<E, A>(self: Exit<E, A>): Exit<E, A> {
  return self._tag === "Success" ? self : halt(C.untraced(self.cause))
}

/**
 * Asserts an exit is a failure
 */
export function assertsFailure<E, A>(exit: Exit<E, A>): asserts exit is Failure<E> {
  if (exit._tag === "Success") {
    throw new Error("expected a failed exit and got success")
  }
}
