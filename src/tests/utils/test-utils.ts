import { Request, Response } from 'express';
import { User } from '../../types/auth';

/**
 * モックリクエストを作成
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  const req = {
    headers: {},
    body: {},
    query: {},
    params: {},
    ...overrides
  } as Request;
  return req;
}

/**
 * モックレスポンスを作成
 */
export function createMockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  } as unknown as Response;
  return res;
}

/**
 * テストユーザーを作成
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    email: 'test@example.com',
    sub: 'test-user-id',
    name: 'Test User',
    ...overrides
  };
}

/**
 * 非同期エラーをキャッチするためのヘルパー
 */
export async function expectAsyncError(
  promise: Promise<any>,
  expectedError: any
): Promise<void> {
  try {
    await promise;
    fail('エラーが発生しませんでした');
  } catch (error) {
    expect(error).toMatchObject(expectedError);
  }
}
