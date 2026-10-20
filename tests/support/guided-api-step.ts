import { test } from "../../shared/browser-preview";
import { guidedOperation } from "../../scripts/guided-api-client.mjs";

export function guidedApiStep<T>(title: string, operation: () => Promise<T>, automatic = false) {
  return test.step(title, () => guidedOperation(title, operation, automatic));
}
