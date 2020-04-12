/* istanbul ignore file */

import { IO, Sync, Either } from "../src";
import * as assert from "assert";

const BarURI = "uris/bar";
interface Bar {
  [BarURI]: {
    getString: () => Sync<string>;
  };
}

const BazURI = "uris/baz";
interface Baz {
  [BazURI]: {
    getString: () => Sync<string>;
  };
}

class AError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class BError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const a1 = IO.pure(1);
const a2 = IO.accessM((_: Bar) => _[BarURI].getString());
const a3 = IO.accessM((_: Baz) => _[BazURI].getString());
const a4 = IO.raiseError(new AError("mmm"));

const b = IO.async<BError, number>((resolve) => {
  const timer = setTimeout(() => {
    resolve(Either.right(1));
  }, 100);
  return (cb) => {
    clearTimeout(timer);
    cb();
  };
});

const c = IO.pipe(
  a1,
  IO.chain((_) => a4)
);

const d = IO.pipe(
  a2,
  IO.chain((_) => a3)
);

const e = IO.fluent(c)
  .pipe((_) => d)
  .pipe(IO.chain((_) => b))
  .done();

const f = IO.Do.do(a1).do(b).bind("c", c).bind("d", d).bind("e", e).done();

const provideBar = IO.provideSO<Bar>({
  [BarURI]: {
    getString: () => IO.pure("bar")
  }
});

const provideBaz = IO.provideSW<Baz>()(a2)((s) => ({
  [BazURI]: {
    getString: () => IO.pure(`value: ${s}`)
  }
}));

describe("Prelude", () => {
  it("should run effect composition", async () => {
    await IO.fluent(f)
      .pipe(provideBaz)
      .pipe(provideBar)
      .pipe(IO.run)
      .done()
      .then((exit) => {
        assert.deepStrictEqual(IO.Exit.isRaise(exit) && exit.error, new AError("mmm"));
      });
  });

  it("should run effect composition - sync", () => {
    const exit = IO.pipe(a3, provideBaz, provideBar, IO.runSync);

    assert.deepStrictEqual(IO.Exit.isDone(exit) && exit.value, "value: bar");
  });
});
