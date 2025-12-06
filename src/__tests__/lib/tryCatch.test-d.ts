import { assertType, expectTypeOf, test } from 'vitest'
import { tryCatch, DatabaseError, createDatabaseError } from '@/lib/tryCatch'
import type { Result, ResultData } from '@/lib/tryCatch'

test('Result type is error-first tuple', () => {
  type StringResult = Result<string>

  expectTypeOf<StringResult>().toEqualTypeOf<[Error, null] | [null, string]>()
})

test('ResultData extracts data type from Result', () => {
  type UserResult = Result<{ id: number; name: string }>

  expectTypeOf<ResultData<UserResult>>().toEqualTypeOf<{ id: number; name: string }>()
})

test('tryCatch sync returns Result tuple', () => {
  const result = tryCatch(() => 'hello')

  expectTypeOf(result).toEqualTypeOf<Result<string>>()
  assertType<Result<string>>(result)
})

test('tryCatch sync infers return type from function', () => {
  const numberResult = tryCatch(() => 42)
  const objectResult = tryCatch(() => ({ id: 1, name: 'test' }))

  expectTypeOf(numberResult).toEqualTypeOf<Result<number>>()
  expectTypeOf(objectResult).toEqualTypeOf<Result<{ id: number; name: string }>>()
})

test('tryCatch async returns Promise of Result', () => {
  const result = tryCatch(Promise.resolve('async value'))

  expectTypeOf(result).toEqualTypeOf<Promise<Result<string>>>()
})

test('tryCatch async infers type from Promise', () => {
  const numberPromise = tryCatch(Promise.resolve(42))
  const objectPromise = tryCatch(Promise.resolve({ id: 1 }))

  expectTypeOf(numberPromise).toEqualTypeOf<Promise<Result<number>>>()
  expectTypeOf(objectPromise).toEqualTypeOf<Promise<Result<{ id: number }>>>()
})

test('destructured tuple has correct types', () => {
  const result: Result<string> = tryCatch(() => 'test')
  const [error, data] = result

  expectTypeOf(error).toEqualTypeOf<Error | null>()
  expectTypeOf(data).toEqualTypeOf<string | null>()
})

test('type narrowing works after error check', () => {
  const result: Result<{ id: number }> = [null, { id: 1 }]
  const [error, data] = result

  if (error) {
    // After error check, error is Error (not null)
    expectTypeOf(error).toEqualTypeOf<Error>()
    // Data should be null when error exists
    expectTypeOf(data).toEqualTypeOf<null>()
    return
  }

  // After null check, error is null
  expectTypeOf(error).toEqualTypeOf<null>()
  // Data should be the success type
  expectTypeOf(data).toEqualTypeOf<{ id: number }>()
})

test('type narrowing works with negated error check', () => {
  const result: Result<string> = [null, 'success']
  const [error, data] = result

  if (!error) {
    expectTypeOf(error).toEqualTypeOf<null>()
    expectTypeOf(data).toEqualTypeOf<string>()
  }
})

test('DatabaseError has correct properties', () => {
  const error = createDatabaseError('SAVE_FAILED', 'save workout')

  expectTypeOf(error).toMatchTypeOf<DatabaseError>()
  expectTypeOf(error.code).toEqualTypeOf<'SAVE_FAILED' | 'LOAD_FAILED' | 'NOT_FOUND'>()
  expectTypeOf(error.operation).toEqualTypeOf<string>()
  expectTypeOf(error.originalCause).toEqualTypeOf<Error | undefined>()
})

test('DatabaseError extends Error', () => {
  const error = new DatabaseError('NOT_FOUND', 'find item')

  expectTypeOf(error).toMatchTypeOf<Error>()
  expectTypeOf(error.message).toEqualTypeOf<string>()
  expectTypeOf(error.name).toEqualTypeOf<string>()
})

test('createDatabaseError returns DatabaseError', () => {
  expectTypeOf(createDatabaseError).returns.toEqualTypeOf<DatabaseError>()
})

test('tryCatch with explicit generic preserves type', () => {
  const result = tryCatch<{ name: string }>(() => JSON.parse('{"name": "test"}'))

  expectTypeOf(result).toEqualTypeOf<Result<{ name: string }>>()
})

test('async tryCatch with explicit generic preserves type', async () => {
  const fetchUser = async (): Promise<{ id: number }> => ({ id: 1 })
  const result = await tryCatch(fetchUser())

  expectTypeOf(result).toEqualTypeOf<Result<{ id: number }>>()
})
