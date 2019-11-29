import * as assert from "assert";
import * as T from "../src";
import * as M from "../src/managed";
import { Do } from "fp-ts-contrib/lib/Do";
import { semigroupSum } from "fp-ts/lib/Semigroup";
import { monoidSum } from "fp-ts/lib/Monoid";

describe("Managed", () => {
  it("should use resource encaseEffect", async () => {
    const resource = M.encaseEffect(T.effect.of(1));

    const result = await T.runToPromise(
      M.use(resource, n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 2);
  });

  it("should use resource encaseEffect with environment", async () => {
    const config = {
      test: 1
    };

    const resource = M.encaseEffect(
      T.accessM(({ test }: typeof config) => T.effect.of(test))
    );

    const result = await T.runToPromise(
      T.provideAll(config)(
        M.use(resource, n =>
          T.accessM(({ test }: typeof config) => T.effect.of(n + test))
        )
      )
    );

    assert.deepEqual(result, 2);
  });

  it("should use resource bracket", async () => {
    let released = false;

    const resource = M.bracket(T.effect.of(1), () =>
      T.sync(() => {
        released = true;
      })
    );

    const result = await T.runToPromise(
      M.use(resource, n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 2);
    assert.deepEqual(released, true);
  });

  it("should use resource pure", async () => {
    const resource = M.pure(1);

    const result = await T.runToPromise(
      M.use(resource, n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 2);
  });

  it("should use resource suspend", async () => {
    const resource = M.suspend(T.sync(() => M.pure(1)));

    const result = await T.runToPromise(
      M.use(resource, n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 2);
  });

  it("should use resource chainWith", async () => {
    const resource = M.pure(1);
    const chainWith = M.chainWith((n: number) => M.pure(n + 1));

    const result = await T.runToPromise(
      M.use(chainWith(resource), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });

  it("should use resource map", async () => {
    const resource = M.pure(1);
    const mapped = M.map(resource, n => n + 1);

    const result = await T.runToPromise(M.use(mapped, n => T.effect.of(n + 1)));

    assert.deepEqual(result, 3);
  });

  it("should use resource mapWith", async () => {
    const resource = M.pure(1);
    const mapped = M.mapWith((n: number) => n + 1);

    const result = await T.runToPromise(
      M.use(mapped(resource), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });

  it("should use resource zip", async () => {
    const ma = M.pure(1);
    const mb = M.pure(1);
    const zip = M.zip(ma, mb);

    const result = await T.runToPromise(
      M.use(zip, ([n, m]) => T.effect.of(n + m))
    );

    assert.deepEqual(result, 2);
  });

  it("should use resource ap", async () => {
    const ma = M.pure(1);
    const mfab = M.pure((n: number) => n + 1);
    const ap = M.ap(ma, mfab);

    const result = await T.runToPromise(M.use(ap, n => T.effect.of(n + 1)));

    assert.deepEqual(result, 3);
  });

  it("should use resource ap_", async () => {
    const ma = M.pure(1);
    const mfab = M.pure((n: number) => n + 1);
    const ap = M.ap_(mfab, ma);

    const result = await T.runToPromise(M.use(ap, n => T.effect.of(n + 1)));

    assert.deepEqual(result, 3);
  });

  it("should use resource as", async () => {
    const ma = M.pure(1);
    const result = await T.runToPromise(
      M.use(M.as(ma, 2), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });

  it("should use resource to", async () => {
    const ma = M.pure(1);
    const result = await T.runToPromise(
      M.use(M.to(2)(ma), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });

  it("should use resource chainTap", async () => {
    const ma = M.pure(1);
    const mm = M.encaseEffect(
      T.sync(() => {
        return {} as unknown;
      })
    );
    const mb = M.chainTap(ma, _ => mm);

    const result = await T.runToPromise(M.use(mb, n => T.effect.of(n + 1)));

    assert.deepEqual(result, 2);
  });

  it("should use resource chainTapWith", async () => {
    const ma = M.pure(1);
    const mm = M.encaseEffect(
      T.sync(() => {
        return {} as unknown;
      })
    );
    const mb = M.chainTapWith((_: number) => mm);

    const result = await T.runToPromise(M.use(mb(ma), n => T.effect.of(n + 1)));

    assert.deepEqual(result, 2);
  });

  it("should use resource allocate", async () => {
    let released = false;

    const program = Do(T.effect)
      .bindL("resource", () =>
        M.allocate(
          M.bracket(T.effect.of(1), () =>
            T.sync(() => {
              released = true;
            })
          )
        )
      )
      .bindL("result", ({ resource }) => T.effect.of(resource.a + 1))
      .doL(({ resource }) => resource.release)
      .return(({ result }) => result);

    const result = await T.runToPromise(program);

    assert.deepEqual(result, 2);
    assert.deepEqual(released, true);
  });

  it("should use resource consume", async () => {
    const resource = M.pure(1);
    const mapped = M.consume((n: number) => T.effect.of(n + 1));

    const result = await T.runToPromise(
      T.effect.chain(mapped(resource), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });

  it("should use resource provideTo", async () => {
    const resourceA = M.pure({ n: 1 });
    const program = T.access(({ n }: { n: number }) => n + 1);

    const result = await T.runToPromise(M.provideTo(resourceA, program));

    assert.deepEqual(result, 2);
  });

  it("should use resource of", async () => {
    const resourceA = M.managedMonad.of(1);

    const result = await T.runToPromise(
      M.use(resourceA, n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 2);
  });

  it("should use resource getSemigroup", async () => {
    const S = M.getSemigroup(semigroupSum);

    const resourceA = M.managedMonad.of(1);
    const resourceB = M.managedMonad.of(1);

    const result = await T.runToPromise(
      M.use(S.concat(resourceB, resourceA), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });

  it("should use resource getMonoid", async () => {
    const S = M.getMonoid(monoidSum);

    const resourceA = M.managedMonad.of(1);
    const resourceB = M.managedMonad.of(1);

    const result = await T.runToPromise(
      M.use(S.concat(resourceB, resourceA), n => T.effect.of(n + 1))
    );

    assert.deepEqual(result, 3);
  });
});
