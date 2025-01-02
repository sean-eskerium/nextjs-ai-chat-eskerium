import type { Document } from '@/lib/db/schema';
import type { SWRResponse, KeyedMutator } from 'swr';

export interface SWRMockResponse<T> extends Partial<SWRResponse<T, any>> {
  data?: T;
  error?: Error;
  isLoading?: boolean;
  isValidating?: boolean;
  mutate?: KeyedMutator<T>;
}

export interface SWRConfigValue {
  mutate: (key: string) => Promise<any>;
}

export function createDocumentSWRMock(
  data?: Document[],
  isLoading = false,
  error?: Error
): SWRMockResponse<Document[]> {
  const mutate = jest.fn().mockImplementation(async () => data);
  
  return {
    data,
    error,
    isLoading,
    isValidating: false,
    mutate: mutate as unknown as KeyedMutator<Document[]>
  };
}

export function createSWRConfigMock(): SWRConfigValue {
  const mutate = jest.fn().mockImplementation(async () => undefined);
  
  return {
    mutate
  };
} 