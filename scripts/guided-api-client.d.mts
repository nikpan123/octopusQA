import type { APIRequestContext } from "@playwright/test";
export function guidedOperation<T>(
  title: string,
  operation: () => Promise<T>,
  automatic?: boolean,
): Promise<T>;
export function observeGuidedRequests(request: APIRequestContext): () => void;
