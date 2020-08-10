import { HKT8, HKT9, Kind, URIS } from "../HKT"

export interface DeriveF<F, Typeclass> {
  readonly Derive: "Derive"
  readonly derive: <K extends string, SI, SO, X, In, S, Env, Err, A>(
    fa: HKT9<Typeclass, K, SI, SO, X, In, S, Env, Err, A>
  ) => HKT9<
    Typeclass,
    K,
    SI,
    SO,
    X,
    In,
    S,
    Env,
    Err,
    HKT8<F, SI, SO, X, In, S, Env, Err, A>
  >
}

export interface DeriveK<F extends URIS, Typeclass extends URIS> {
  readonly Derive: "Derive"
  readonly derive: <K extends string, SI, SO, X, In, S, Env, Err, A>(
    fa: Kind<Typeclass, K, SI, SO, X, In, S, Env, Err, A>
  ) => Kind<
    Typeclass,
    K,
    SI,
    SO,
    X,
    In,
    S,
    Env,
    Err,
    Kind<F, K, SI, SO, X, In, S, Env, Err, A>
  >
}

export function makeDerive<F extends URIS, Typeclass extends URIS>(
  _: F,
  __: Typeclass
): (_: Omit<DeriveK<F, Typeclass>, "Derive">) => DeriveK<F, Typeclass>
export function makeDerive<F, Typeclass>(
  _: F,
  __: Typeclass
): (_: Omit<DeriveF<F, Typeclass>, "Derive">) => DeriveF<F, Typeclass>
export function makeDerive<F, Typeclass>(
  _: F,
  __: Typeclass
): (_: Omit<DeriveF<F, Typeclass>, "Derive">) => DeriveF<F, Typeclass> {
  return (_) => ({
    Derive: "Derive",
    ..._
  })
}
