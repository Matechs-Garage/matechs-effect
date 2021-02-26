import type { HasClock } from "../../Clock/definition"
import * as E from "../../Either"
import { pipe } from "../../Function"
import type * as SC from "../../Schedule"
import type { Stream } from "./definitions"
import { repeatWith } from "./repeatWith"

/**
 * Repeats the entire stream using the specified schedule. The stream will execute normally,
 * and then repeat again according to the provided schedule. The schedule output will be emitted at
 * the end of each repetition.
 */
export function repeatEither_<R, R1, E, O, B>(
  self: Stream<R, E, O>,
  schedule: SC.Schedule<R1, any, B>
): Stream<R & R1 & HasClock, E, E.Either<B, O>> {
  return pipe(self, repeatWith(schedule)(E.right, E.left))
}

/**
 * Repeats the entire stream using the specified schedule. The stream will execute normally,
 * and then repeat again according to the provided schedule. The schedule output will be emitted at
 * the end of each repetition.
 */
export function repeatEither<R1, B>(schedule: SC.Schedule<R1, any, B>) {
  return <R, E, O>(self: Stream<R, E, O>) => repeatEither_(self, schedule)
}
