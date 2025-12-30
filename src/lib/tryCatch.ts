/**
 * Error-first tuple result type.
 * Success: [null, T] | Failure: [Error, null]
 */
type Result<T> = [Error, null] | [null, T]

/**
 * Normalizes unknown catch values to Error.
 */
function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  return new Error(String(error))
}

/**
 * Wraps a synchronous function in error-first tuple handling.
 * @returns [error, null] on failure, [null, data] on success
 */
export function tryCatch<T>(function_: () => T): Result<T>

/**
 * Wraps a Promise in error-first tuple handling.
 * @returns Promise<[error, null]> on rejection, Promise<[null, data]> on resolution
 */
export function tryCatch<T>(promise: Promise<T>): Promise<Result<T>>

/**
 * Implementation handling both sync functions and promises.
 */
export function tryCatch<T>(
  input: Promise<T> | (() => T),
): Result<T> | Promise<Result<T>> {
  // Handle async (Promise)
  if (input instanceof Promise) {
    return input
      .then((data): Result<T> => [null, data])
      .catch((error: unknown): Result<T> => [normalizeError(error), null])
  }

  // Handle sync (function)
  try {
    const data = input()
    return [null, data]
  } catch (error: unknown) {
    return [normalizeError(error), null]
  }
}

/**
 * Database error codes.
 */
export const DatabaseErrorCode = {
  SAVE_FAILED: 'SAVE_FAILED',
  LOAD_FAILED: 'LOAD_FAILED',
  NOT_FOUND: 'NOT_FOUND',
} as const

export type DatabaseErrorCode = (typeof DatabaseErrorCode)[keyof typeof DatabaseErrorCode]

/**
 * Custom error class for database operations.
 */
export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode
  readonly operation: string
  readonly originalCause?: Error

  constructor(code: DatabaseErrorCode, operation: string, cause?: Error) {
    super(`Database ${code}: ${operation}`)
    this.name = 'DatabaseError'
    this.code = code
    this.operation = operation
    this.originalCause = cause
  }
}

/**
 * Creates a typed database error.
 */
export function createDatabaseError(
  code: DatabaseErrorCode,
  operation: string,
  cause?: unknown,
): DatabaseError {
  const errorCause = cause instanceof Error ? cause : undefined
  return new DatabaseError(code, operation, errorCause)
}
