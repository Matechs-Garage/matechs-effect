import { identity } from "../Function"
import { IAccessInterruptible } from "../Support/Common"
import { Sync } from "../Support/Common/effect"

/**
 * Get the interruptible state of the current fiber
 */
export const accessInterruptible: Sync<boolean> = new IAccessInterruptible(
  identity
) as any
