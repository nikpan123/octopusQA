const CATEGORY_DETAILS = {
  LOCATOR_NOT_FOUND: {
    label: "Brak elementu",
    suggestion: "Sprawdź lokator oraz czy właściwy widok lub dialog został otwarty.",
  },
  ELEMENT_NOT_VISIBLE: {
    label: "Element niewidoczny",
    suggestion: "Sprawdź stan widoku, animację lub warunek, który pokazuje element.",
  },
  ELEMENT_DISABLED: {
    label: "Element nieaktywny",
    suggestion: "Sprawdź, czy formularz spełnia warunki aktywujące element.",
  },
  ELEMENT_BLOCKED: {
    label: "Element zasłonięty",
    suggestion: "Sprawdź nakładkę, spinner, dialog lub element przechwytujący kliknięcie.",
  },
  LOCATOR_AMBIGUOUS: {
    label: "Niejednoznaczny lokator",
    suggestion: "Doprecyzuj lokator, ponieważ pasuje do więcej niż jednego elementu.",
  },
  ASSERTION_FAILED: {
    label: "Niespełnione oczekiwanie",
    suggestion: "Porównaj wartość oczekiwaną z otrzymaną w szczegółach błędu.",
  },
  NAVIGATION_TIMEOUT: {
    label: "Przekroczony czas nawigacji",
    suggestion: "Sprawdź odpowiedź aplikacji, przekierowania i czas ładowania strony.",
  },
  NETWORK_ERROR: {
    label: "Błąd sieci lub API",
    suggestion: "Sprawdź niedostępne żądanie, status odpowiedzi i dostępność środowiska.",
  },
  AUTH_ERROR: {
    label: "Błąd sesji lub logowania",
    suggestion: "Odśwież sesję i sprawdź, czy konto ma dostęp do badanego widoku.",
  },
  TIMEOUT: {
    label: "Przekroczony czas",
    suggestion: "Sprawdź ostatni krok testu i stan aplikacji zapisany w trace.",
  },
  UNKNOWN: {
    label: "Inny błąd",
    suggestion: "Otwórz pełny komunikat i trace, aby zobaczyć ostatnie działanie testu.",
  },
};

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, "g");

function clean(value) {
  return String(value ?? "")
    .replace(ANSI_PATTERN, "")
    .replace(/\r/g, "")
    .trim();
}

function firstUsefulLine(message) {
  return message
    .split("\n")
    .map((line) => line.trim())
    .find(
      (line) =>
        line && !/^Error:$/i.test(line) && !/^Call log:/i.test(line) && !/^-+\s*$/.test(line),
    );
}

function extractLocator(message) {
  const patterns = [
    /waiting for (?:expect\([^)]*\)\.)?(.+?)(?:\s+to be|\s*$)/im,
    /Locator:\s*(.+)$/im,
    /locator resolved to .+?\n\s*(.+)$/im,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1])
      return clean(match[1])
        .replace(/^[-–]\s*/, "")
        .slice(0, 500);
  }
  return null;
}

function extractAction(message) {
  const match = message.match(/^(?:Error:\s*)?([a-zA-Z]+(?:\.[a-zA-Z]+)+):/m);
  return match?.[1] ?? null;
}

function localizedSummary(category, locator, technicalSummary) {
  const target = locator ? `: ${locator}` : "";
  const summaries = {
    LOCATOR_NOT_FOUND: `Nie znaleziono elementu pasującego do lokatora${target}.`,
    ELEMENT_NOT_VISIBLE: `Element istnieje, ale nie stał się widoczny${target}.`,
    ELEMENT_DISABLED: `Element pozostał nieaktywny${target}.`,
    ELEMENT_BLOCKED: `Nie można wykonać akcji, ponieważ element jest zasłonięty lub niestabilny${target}.`,
    LOCATOR_AMBIGUOUS: `Lokator pasuje do więcej niż jednego elementu${target}.`,
    ASSERTION_FAILED: "Wartość otrzymana przez test różni się od oczekiwanej.",
    NAVIGATION_TIMEOUT: "Strona nie zakończyła nawigacji w wyznaczonym czasie.",
    NETWORK_ERROR: "Żądanie sieciowe lub wywołanie API zakończyło się błędem.",
    AUTH_ERROR: "Sesja wygasła albo konto nie ma dostępu do badanego widoku.",
    TIMEOUT: "Ostatnia operacja testu nie zakończyła się w wyznaczonym czasie.",
  };
  return summaries[category] ?? technicalSummary ?? CATEGORY_DETAILS.UNKNOWN.label;
}

export function classifyFailure(input = {}) {
  const message = clean(input.message || input.stack || input.value || "");
  const lower = message.toLowerCase();
  let category = "UNKNOWN";

  if (/strict mode violation|resolved to \d+ elements/.test(lower)) {
    category = "LOCATOR_AMBIGUOUS";
  } else if (/element is (?:not )?enabled|waiting for element to be enabled/.test(lower)) {
    category = "ELEMENT_DISABLED";
  } else if (
    /intercepts pointer events|another element.*receives pointer|outside of the viewport|element is not stable/.test(
      lower,
    )
  ) {
    category = "ELEMENT_BLOCKED";
  } else if (
    /element is not visible|waiting for element to be visible|hidden instead of visible/.test(lower)
  ) {
    category = "ELEMENT_NOT_VISIBLE";
  } else if (
    /element\(s\) not found|waiting for (?:expect\([^)]*\)\.)?(?:getby|locator\(|page\.|frame\.)/.test(
      lower,
    )
  ) {
    category = "LOCATOR_NOT_FOUND";
  } else if (/navigation timeout|page\.goto: timeout|page\.waitforurl: timeout/.test(lower)) {
    category = "NAVIGATION_TIMEOUT";
  } else if (
    /net::err_|request failed|econnrefused|econnreset|enotfound|socket hang up|http \d{3}/.test(
      lower,
    )
  ) {
    category = "NETWORK_ERROR";
  } else if (/unauthorized|forbidden|jwt|storage state|logowanie|sesj[aię]|401|403/.test(lower)) {
    category = "AUTH_ERROR";
  } else if (
    /expect\(|expect\.|expected:|received:|tohave|tobevisible|tocontain|assertion/.test(lower)
  ) {
    category = "ASSERTION_FAILED";
  } else if (/timeout.*exceeded|timed out|timeout/.test(lower) || input.status === "timedOut") {
    category = "TIMEOUT";
  }

  const details = CATEGORY_DETAILS[category];
  const technicalSummary = firstUsefulLine(message);
  const locator = extractLocator(message);
  return {
    category,
    label: details.label,
    summary: localizedSummary(category, locator, technicalSummary),
    suggestion: details.suggestion,
    action: extractAction(message),
    locator,
    message: message.slice(0, 12_000),
  };
}

export function categoryDetails(category) {
  return CATEGORY_DETAILS[category] ?? CATEGORY_DETAILS.UNKNOWN;
}
