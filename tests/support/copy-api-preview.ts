import type { CopyData, CopyNode } from "./order-copy";
import { orderRow, expandOrderItems } from "./order";
import { test } from "../../shared/browser-preview";

export function copyApiBrowserPreviewEnabled() {
  return process.env.OCTOPUS_GUIDED_API === "1" &&
    (process.env.OCTOPUS_GUIDED_BROWSER === "1" || process.env.QA_TEST_DEBUGGER === "1");
}

// Read-only visual companion. Never click Copy/Save or replace the API action.
// Normal regression does not execute any of these browser operations.
export async function showCopyApiPreview(data: CopyData, node: CopyNode, orderId?: string) {
  if (!copyApiBrowserPreviewEnabled()) return;
  const panel = await data.panel(node);
  if (orderId) {
    await orderRow(panel, orderId).click();
    await expandOrderItems(panel, orderId);
  }
  await test
    .info()
    .attach(
      `Podgląd przeglądarki — ${node}${orderId ? ` — dokument ${orderId}` : " — lista zamówień"}`,
      {
        body: await panel.page().screenshot(),
        contentType: "image/png",
      },
    );
}
