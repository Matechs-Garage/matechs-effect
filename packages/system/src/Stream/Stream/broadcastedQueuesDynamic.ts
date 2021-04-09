// tracing: off

import type * as Q from "../../Queue"
import * as M from "../_internal/managed"
import type * as Take from "../Take"
import type { Stream } from "./definitions"
import { toHub_ } from "./toHub"

/**
 * Converts the stream to a managed dynamic amount of queues. Every chunk will be replicated to every queue with the
 * slowest queue being allowed to buffer `maximumLag` chunks before the driver is backpressured.
 * The downstream queues will be provided with chunks in the same order they are returned, so
 * the fastest queue might have seen up to (`maximumLag` + 1) chunks more than the slowest queue if it
 * has a lower index than the slowest queue.
 *
 * Queues can unsubscribe from upstream by shutting down.
 */
export function broadcastedQueuesDynamic_<R, E, O>(
  self: Stream<R, E, O>,
  maximumLag: number
): M.Managed<R, never, M.Managed<unknown, never, Q.Dequeue<Take.Take<E, O>>>> {
  return M.map_(toHub_(self, maximumLag), (_) => _.subscribe)
}

/**
 * Converts the stream to a managed dynamic amount of queues. Every chunk will be replicated to every queue with the
 * slowest queue being allowed to buffer `maximumLag` chunks before the driver is backpressured.
 * The downstream queues will be provided with chunks in the same order they are returned, so
 * the fastest queue might have seen up to (`maximumLag` + 1) chunks more than the slowest queue if it
 * has a lower index than the slowest queue.
 *
 * Queues can unsubscribe from upstream by shutting down.
 */
export function broadcastedQueuesDynamic(maximumLag: number) {
  return <R, E, O>(self: Stream<R, E, O>) => broadcastedQueuesDynamic_(self, maximumLag)
}
