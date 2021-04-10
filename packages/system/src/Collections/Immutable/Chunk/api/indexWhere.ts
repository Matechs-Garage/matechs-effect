import type * as Chunk from "../core"
import { indexWhereFrom_ } from "./indexWhereFrom"

/**
 * Returns the first index for which the given predicate is satisfied.
 */
export function indexWhere_<A>(self: Chunk.Chunk<A>, f: (a: A) => boolean): number {
  return indexWhereFrom_(self, 0, f)
}

/**
 * Returns the first index for which the given predicate is satisfied.
 *
 * @dataFirst indexWhere_
 */
export function indexWhere<A>(f: (a: A) => boolean): (self: Chunk.Chunk<A>) => number {
  return (self) => indexWhere_(self, f)
}
