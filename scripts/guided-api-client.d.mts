import type { APIRequestContext } from "@playwright/test";
export type GuidedInspection = {
  phase: "before" | "after" | "cleanup";
  message: string;
  preview: boolean;
  schools: Array<{id:string;url:string;node:string;name:string;role:string;orders:Array<{id:string;symbol:string;copied:boolean}>}>;
  request?: {method:string;path:string;body:unknown};
};
export function guidedOperation<T>(
  title: string,
  operation: () => Promise<T>,
  automatic?: boolean,
  options?: {checkpoint?:boolean;inspection?:GuidedInspection},
): Promise<T>;
export function observeGuidedRequests(request: APIRequestContext): () => void;
