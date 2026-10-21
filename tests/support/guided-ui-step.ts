import { test } from "../../shared/browser-preview";
import { guidedOperation } from "../../scripts/guided-api-client.mjs";

// The same business steps appear in the debugger and the Playwright report.
// With the debugger disabled this is an ordinary test.step().
export function guidedUiStep<T>(title: string, operation: () => Promise<T>) {
  return test.step(title, () => guidedOperation(title, operation));
}
