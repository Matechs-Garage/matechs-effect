import * as A from "../src/Array"
import * as T from "../src/Effect"
import * as E from "../src/Either"
import * as Ex from "../src/Exit"
import { pipe } from "../src/Function"
import { PrematureGeneratorExit } from "../src/GlobalExceptions"
import { tag } from "../src/Has"
import * as M from "../src/Managed"
import * as O from "../src/Option"
import * as S from "../src/Stream"
import * as X from "../src/Sync"

type A = {
  a: number
}

type B = {
  b: number
}

const program = T.gen(function* (_) {
  const a = yield* _(T.access((_: A) => _.a))
  const b = yield* _(T.access((_: B) => _.b))

  const c = a + b

  if (c > 10) {
    yield* _(T.fail(`${c} should be lower then x`))
  }

  return c
})

const programNumber = T.gen<number>()(function* (_) {
  const a = yield* _(T.access((_: A) => _.a))
  const b = yield* _(T.access((_: B) => _.b))

  const c = a + b

  if (c > 10) {
    yield* _(T.fail(`${c} should be lower then x`))
  }

  return c
})

const programNumberFailString = T.gen<string, number>()(function* (_) {
  const a = yield* _(T.access((_: A) => _.a))
  const b = yield* _(T.access((_: B) => _.b))

  const c = a + b

  if (c > 10) {
    yield* _(T.fail(`${c} should be lower then x`))
  }

  return c
})

const programNumberFailStringR = T.gen<A & B & { foo: string }, string, number>()(
  function* (_) {
    const a = yield* _(T.access((_: A) => _.a))
    const b = yield* _(T.access((_: B) => _.b))

    const c = a + b

    if (c > 10) {
      yield* _(T.fail(`${c} should be lower then x`))
    }

    return c
  }
)

class MyError {
  readonly _tag = "MyError"
}

describe("Generator", () => {
  it("should use generator program", async () => {
    const result = await pipe(
      program,
      T.provideAll<A & B>({ a: 1, b: 2 }),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.succeed(3))
  })
  it("should use generator programNumber", async () => {
    const result = await pipe(
      programNumber,
      T.provideAll<A & B>({ a: 1, b: 2 }),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.succeed(3))
  })
  it("should use generator programNumberFailString", async () => {
    const result = await pipe(
      programNumberFailString,
      T.provideAll<A & B>({ a: 1, b: 2 }),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.succeed(3))
  })
  it("should use generator programNumberFailStringR", async () => {
    const result = await pipe(
      programNumberFailStringR,
      T.provideAll<A & B>({ a: 1, b: 2 }),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.succeed(3))
  })
  it("should use generator program (failing)", async () => {
    const result = await pipe(
      program,
      T.provideAll<A & B>({ a: 10, b: 2 }),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.fail("12 should be lower then x"))
  })
  it("catches defects", async () => {
    const result = await pipe(
      T.gen(function* (_) {
        yield* _(T.unit)
        throw new Error("defect")
      }),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.die(new Error("defect")))
  })
  it("mix types", async () => {
    class SumTooBig {
      readonly _tag = "SumTooBig"
      constructor(readonly message: string) {}
    }

    const sum = (n: number) =>
      T.gen(function* (_) {
        let sum = 0
        for (const i of A.range(0, n)) {
          sum += yield* _(T.succeed(i))
        }
        return sum
      })

    const program1 = T.gen(function* (_) {
      const a = yield* _(E.right(1))
      const b = yield* _(O.some(2))
      const c = yield* _(T.access((_: A) => _.a))

      return { a, b, c }
    })

    const program2 = T.gen(function* (_) {
      const { a, b, c } = yield* _(program1)
      const d = yield* _(T.access((_: B) => _.b))

      const s = a + b + c + d

      if (s > 20) {
        return yield* _(T.fail(new SumTooBig(`${s} > 20`)))
      }

      return yield* _(sum(s))
    })

    expect(
      await pipe(
        program2,
        T.provideAll<A & B>({ a: 3, b: 4 }),
        T.runPromiseExit
      )
    ).toEqual(Ex.succeed(55))
  })

  it("should use services", async () => {
    class CalcService {
      add(x: number, y: number) {
        return T.effectTotal(() => x + y)
      }
    }

    interface Calc extends CalcService {}
    const Calc = tag<Calc>()

    const prog = T.gen(function* (_) {
      const { add } = yield* _(Calc)

      return yield* _(add(2, 3))
    })

    const result = await pipe(
      prog,
      T.provideService(Calc)(new CalcService()),
      T.runPromiseExit
    )

    expect(result).toEqual(Ex.succeed(5))
  })

  it("either gen", () => {
    const result = E.gen(function* (_) {
      const a = yield* _(O.some(1))
      const b = yield* _(O.some(2))
      const c = yield* _(E.right(3))

      if (a + b + c > 10) {
        yield* _(E.left(new MyError()))
      }

      return { a, b, c }
    })

    expect(result).toEqual(E.right({ a: 1, b: 2, c: 3 }))
  })

  it("sync gen", () => {
    const result = X.gen(function* (_) {
      const a = yield* _(O.some(1))
      const b = yield* _(O.some(2))
      const c = yield* _(E.right(3))
      const d = yield* _(X.access((_: { n: number }) => _.n))

      if (a + b + c + d > 10) {
        yield* _(E.left(new MyError()))
      }

      return { a, b, c, d }
    })

    expect(pipe(result, X.runEitherEnv({ n: 4 }))).toEqual(
      E.right({ a: 1, b: 2, c: 3, d: 4 })
    )
    expect(pipe(result, X.runEitherEnv({ n: 7 }))).toEqual(E.left(new MyError()))
  })

  it("stream gen", async () => {
    const result = S.gen(function* (_) {
      const a = yield* _(() => O.some(0))
      const b = yield* _(() => E.right(1))
      const c = yield* _(() => T.succeed(2))
      const d = yield* _(() => S.fromChunk([a, b, c]))

      return d
    })
    expect(await pipe(result, S.runCollect, T.runPromiseExit)).toEqual(
      Ex.succeed([0, 1, 2])
    )
  })

  it("stream gen #2", async () => {
    let x = 0
    const result = S.gen(function* (_) {
      const a = yield* _(() =>
        S.repeatEffectOption(
          T.effectAsync<unknown, O.Option<never>, number>((cb) => {
            setTimeout(() => {
              if (x > 2) {
                cb(T.fail(O.none))
              } else {
                cb(T.succeed(x))
              }
              x += 1
            }, 100)
          })
        )
      )
      const b = a + 1
      const c = yield* _(() => S.fromChunk(A.range(b, 10)))
      return c
    })
    expect(await pipe(result, S.runCollect, T.runPromiseExit)).toEqual(
      Ex.succeed([...A.range(1, 10), ...A.range(2, 10), ...A.range(3, 10)])
    )
  })

  it("stream gen #3", async () => {
    let b = 0
    const result = S.gen(function* (_) {
      const a = yield* _(() => S.fromChunk([0, 1, 2]))
      b++ // this is impure stuff that breaks the generator
      if (b > 1) return 0
      const n = yield* _(() => S.fromChunk(A.range(0, a)))
      return n + 1
    })
    expect(await pipe(result, S.runCollect, T.runPromiseExit)).toEqual(
      Ex.die(new PrematureGeneratorExit())
    )
  })

  it("managed gen", async () => {
    const fn = jest.fn()
    const result = M.gen(function* (_) {
      const a = yield* _(O.some(0))
      const b = yield* _(E.right(1))
      const c = yield* _(T.succeed(2))
      const d = yield* _(
        M.makeExit_(T.succeed(3), () =>
          T.effectTotal(() => {
            fn()
          })
        )
      )

      expect(fn).toHaveBeenCalledTimes(0)

      return { a, b, c, d }
    })
    expect(await pipe(result, M.use(T.succeed), T.runPromiseExit)).toEqual(
      Ex.succeed({ a: 0, b: 1, c: 2, d: 3 })
    )
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
