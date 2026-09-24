import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getTeacherEntries } from "./cleanup-teachers.mjs";

// Inwentaryzacja lokalnych rejestrów, nie autoryzacja usuwania.
// Przed operacją w Octopusie trzeba ponownie sprawdzić właściciela i flagę Testowy.
export function buildInventory(logs) {
  const records = new Map();
  const add = (kind, id, file, result, parentId, name, cleanupStatus) => {
    if (!/^\d+$/.test(String(id ?? ""))) return;
    const key = `${kind}:${id}`;
    const item = records.get(key) ?? { kind, id: String(id), references: [] };
    item.references.push({
      file,
      result: result ?? "UNKNOWN",
      ...(parentId ? { parentId: String(parentId) } : {}),
      ...(name ? { name } : {}),
      ...(cleanupStatus ? { cleanupStatus } : {}),
    });
    records.set(key, item);
  };
  for (const { file, data: d } of logs) {
    if (d.kind === "shared-school") {
      add("school", d.id, file, "SHARED", undefined, d.name);
      continue;
    }
    add("school", d.schoolId, file, d.result, undefined, d.relatedSchoolName ?? d.schoolName);
    add("school", d.secondSchoolId, file, d.result, undefined, d.schoolName);
    // Jeden przebieg może utworzyć wielu nauczycieli (np. test kontraktowy
    // dodawanie+edycja) - iterujemy po wszystkich, nie tylko po pierwszym.
    for (const entry of getTeacherEntries(d)) {
      add(
        "teacher",
        entry.teacherId,
        file,
        d.result,
        d.schoolId,
        entry.teacherLastName ?? d.editedLastName ?? d.lastName ?? d.id,
        entry.cleanupStatus,
      );
    }
    add("order", d.orderId, file, d.result, d.schoolId);
    add("confirmation", d.confirmationId, file, d.result, d.teacherId);
  }
  return [...records.values()].map((item) => ({
    ...item,
    review: item.references.every((r) => ["DELETED", "ALREADY_ABSENT"].includes(r.cleanupStatus))
      ? "ABSENCE_CONFIRMED"
      : item.references.some((r) => !["PASS", "SHARED"].includes(r.result))
        ? "KEEP_FOR_DIAGNOSIS"
        : "VERIFY_IN_OCTOPUS",
  }));
}

async function main() {
  if (process.argv.length > 2)
    throw new Error("Podgląd nie przyjmuje parametrów i nie wykonuje usuwania.");
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const runs = path.join(root, "runs");
  const files = await readdir(runs).catch((e) => {
    if (e.code === "ENOENT") return [];
    throw e;
  });
  const logs = [];
  const unreadable = [];
  for (const file of files.filter((f) => /^REG_[\w-]+\.json$/.test(f)).sort()) {
    try {
      logs.push({ file, data: JSON.parse(await readFile(path.join(runs, file), "utf8")) });
    } catch {
      unreadable.push(file);
    }
  }
  const records = buildInventory(logs);
  console.log("PODGLĄD — brak połączenia z Octopusem, żadne dane nie zostaną zmienione.");
  console.table(
    records.map((r) => ({
      typ: r.kind,
      ID: r.id,
      rejestry: r.references.length,
      status: r.review,
    })),
  );
  console.log(`Rejestry: ${logs.length}; unikalne rekordy z zapisanym ID: ${records.length}.`);
  console.log("VERIFY_IN_OCTOPUS = wymaga weryfikacji w aplikacji, nie zgoda na usunięcie.");
  console.log("KEEP_FOR_DIAGNOSIS = co najmniej jeden przebieg nie zakończył się PASS.");
  console.log("Lista może być niepełna: starsze lub przerwane testy mogły nie zapisać ID.");
  if (unreadable.length) console.warn("Nieczytelne rejestry:", unreadable.join(", "));
  if (files.length) {
    const output = path.join(runs, "cleanup-preview.json");
    await writeFile(
      output,
      JSON.stringify(
        { generatedAt: new Date().toISOString(), mode: "preview-only", unreadable, records },
        null,
        2,
      ),
    );
    console.log(`Szczegóły i powiązania: ${output}`);
  }
  if (unreadable.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
