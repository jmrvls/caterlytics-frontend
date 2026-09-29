import { vi } from 'vitest';


export function mockQuery(response = { data: null, error: null }) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(response)),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
  };
  return builder;
}

/** A ready-to-use mocked supabase client. Reset it in beforeEach(). */
export function createSupabaseMock() {
  return {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  };
}