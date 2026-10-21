import type { CopyData, CopyNode } from "./order-copy";
import type { GuidedInspection } from "../../scripts/guided-api-client.mjs";
import { OCTOPUS_BASE_URL } from "./environment";

export function copyInspection(
  data: CopyData,
  snapshot: Awaited<ReturnType<CopyData["snapshot"]>>,
  source: CopyNode | undefined,
  target: CopyNode,
  phase: GuidedInspection["phase"],
  request?: GuidedInspection["request"],
): GuidedInspection {
  const messages = {
    before: "Dane są przygotowane. Otwórz szkoły w osobnych kartach, przejdź do Zamówień i porównaj ID dokumentów. Badane żądanie API nie zostało jeszcze wysłane. Nie edytuj danych podczas podglądu.",
    after: "Żądanie zostało wysłane. Sprawdź zamówienia w źródle i celu, odświeżając otwarte karty. Ten test oczekuje odrzucenia niedozwolonej kopii i braku zmian w dokumentach; sam kod HTTP nie potwierdza poprawności.",
    cleanup: "Test zatrzymał się przed sprzątaniem. Możesz nadal oglądać szkoły i dokumenty, także po niezaliczonej kontroli. Zatwierdzenie tego punktu pozwoli usunąć dokumenty i relacje utworzone przez test. Linki po sprzątaniu mogą prowadzić do nieaktualnych danych.",
  };
  return {
    phase, preview: true, message: messages[phase],
    schools: data.nodes.map(node => ({
      node, id: data.schools[node].id, name: data.schools[node].name,
      url: `${OCTOPUS_BASE_URL}/school/school-panel/${encodeURIComponent(data.schools[node].id)}`,
      role: node === source && node === target ? "Źródło i cel" : node === source ? "Źródło żądania" : node === target ? "Cel żądania" : "Pozostałe dane testu",
      orders: (snapshot[node] || []).map(order => ({id:String(order.id), symbol:order.salesOrderSymbol || order.cmsOrderSymbol || "", copied:Boolean(order.isCopied)})),
    })),
    ...(request ? {request} : {}),
  };
}
