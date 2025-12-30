import { describe, expect, it } from 'vitest'
import { tryCatch, createDatabaseError, DatabaseError } from '@/lib/tryCatch'

describe('tryCatch', () => {
  describe('async operations', () => {
    it('returns [null, data] on successful promise', async () => {
      const [error, data] = await tryCatch(Promise.resolve('success'))

      expect(error).toBeNull()
      expect(data).toBe('success')
    })

    it('returns [error, null] on rejected promise', async () => {
      const [error, data] = await tryCatch(Promise.reject(new Error('failed')))

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('failed')
      expect(data).toBeNull()
    })

    it('normalizes non-Error rejections to Error', async () => {
      const [error, data] = await tryCatch(Promise.reject('string error'))

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('string error')
      expect(data).toBeNull()
    })

    it('handles async function that resolves', async () => {
      const [error, data] = await tryCatch(Promise.resolve(42))

      expect(error).toBeNull()
      expect(data).toBe(42)
    })

    it('handles async function that rejects', async () => {
      const [error, data] = await tryCatch(Promise.reject(new Error('async error')))

      expect(error?.message).toBe('async error')
      expect(data).toBeNull()
    })
  })

  describe('sync operations', () => {
    it('returns [null, data] on successful function', () => {
      const [error, data] = tryCatch(() => 42)

      expect(error).toBeNull()
      expect(data).toBe(42)
    })

    it('returns [error, null] on throwing function', () => {
      const [error, data] = tryCatch(() => {
        throw new Error('sync error')
      })

      expect(error?.message).toBe('sync error')
      expect(data).toBeNull()
    })

    it('normalizes non-Error throws to Error', () => {
      const [error, data] = tryCatch(() => {
         
        throw 'string throw'
      })

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('string throw')
      expect(data).toBeNull()
    })

    it('handles JSON.parse success', () => {
      const json = '{"name": "test"}'
      const [error, data] = tryCatch<{ name: string }>(() => JSON.parse(json))

      expect(error).toBeNull()
      expect(data).toEqual({ name: 'test' })
    })

    it('handles JSON.parse failure', () => {
      const invalidJson = 'not json'
      const [error, data] = tryCatch(() => JSON.parse(invalidJson))

      expect(error).toBeInstanceOf(SyntaxError)
      expect(data).toBeNull()
    })
  })

  describe('type narrowing', () => {
    it('narrows data type after error check', async () => {
      const [error, data] = await tryCatch<string>(Promise.resolve('test'))

      if (error) {
        // TypeScript knows: data is null here
        expect(data).toBeNull()
        return
      }

      // TypeScript knows: data is string here
      expect(data.toUpperCase()).toBe('TEST')
    })

    it('narrows error type after success check', async () => {
      const [error, data] = await tryCatch(Promise.resolve({ id: 1, name: 'test' }))

      if (!error) {
        // TypeScript knows: data is the object type
        expect(data.id).toBe(1)
        expect(data.name).toBe('test')
      }
    })
  })

  describe('custom error types', () => {
    it('creates database error with code and operation', () => {
      const error = createDatabaseError('SAVE_FAILED', 'save workout')

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('SAVE_FAILED')
      expect(error.operation).toBe('save workout')
      expect(error.message).toBe('Database SAVE_FAILED: save workout')
    })

    it('attaches originalCause to database error', () => {
      const cause = new Error('Connection refused')
      const error = createDatabaseError('LOAD_FAILED', 'load workout', cause)

      expect(error.code).toBe('LOAD_FAILED')
      expect(error.originalCause).toBe(cause)
    })

    it('ignores non-Error cause', () => {
      const error = createDatabaseError('NOT_FOUND', 'find workout', 'string cause')

      expect(error.originalCause).toBeUndefined()
    })

    it('works with tryCatch and preserves DatabaseError type', async () => {
      const databaseError = createDatabaseError('SAVE_FAILED', 'save workout')
      const [error] = await tryCatch<void>(Promise.reject(databaseError))

      expect(error).toBeInstanceOf(DatabaseError)
      if (error instanceof DatabaseError) {
        expect(error.code).toBe('SAVE_FAILED')
        expect(error.operation).toBe('save workout')
      }
    })
  })
})
