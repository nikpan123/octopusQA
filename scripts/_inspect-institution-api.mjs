import { readStoredSession } from "./auth.mjs";

const origin = "https://octopus.gwodev.pl";
const { storageState } = readStoredSession();
const localStorageEntries = new Map(
  storageState.origins
    .find((entry) => entry.origin === origin)
    ?.localStorage.map((entry) => [entry.name, entry.value]) ?? [],
);
let token = localStorageEntries.get("token");
if (!token) throw new Error("Brak tokenu zapisanej sesji DEV.");
try {
  token = JSON.parse(token);
} catch {
  // Token może być zapisany bez opakowania JSON.
}
const cookie = storageState.cookies
  .filter((entry) => new URL(origin).hostname.endsWith(entry.domain.replace(/^\./, "")))
  .map((entry) => `${entry.name}=${entry.value}`)
  .join("; ");

async function get(pathname) {
  const response = await fetch(`${origin}${pathname}`, {
    headers: { Authorization: `Bearer ${token}`, Cookie: cookie },
  });
  const text = await response.text();
  console.log("GET", pathname, response.status);
  if (response.status < 200 || response.status >= 300) {
    console.log(text.slice(0, 500));
    return undefined;
  }
  return JSON.parse(text);
}

console.log("SCHOOL_TYPES", JSON.stringify(await get("/api/Dictionary/GetSchoolTypes")));
for (const filter of [
  { zipCode: "80-064", page: 1, limit: 1, saveSearchHistory: false },
  { institutionIds: [93705], page: 1, limit: 1, saveSearchHistory: false },
]) {
  const result = await get(
    `/api/InstitutionBrowser/GetInstitutions?filterModel=${encodeURIComponent(JSON.stringify(filter))}`,
  );
  console.log("INSTITUTIONS", JSON.stringify(result));
}
