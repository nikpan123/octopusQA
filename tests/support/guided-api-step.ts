import { test } from "../../shared/browser-preview";
import { guidedOperation } from "../../scripts/guided-api-client.mjs";
import type { GuidedInspection } from "../../scripts/guided-api-client.mjs";

export function guidedApiStep<T>(title: string, operation: () => Promise<T>, automatic = false) {
  return test.step(title, () => guidedOperation(title, operation, automatic));
}

export async function guidedInspection(title: string, inspection: GuidedInspection) {
  if (process.env.QA_TEST_DEBUGGER !== "1" && process.env.OCTOPUS_GUIDED_BROWSER !== "1") return;
  return test.step(title, () => guidedOperation(title, async () => {}, false, {checkpoint:true, inspection}));
}
