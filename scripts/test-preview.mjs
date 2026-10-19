import { createRequire } from "node:module";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
// Ten sam czytnik ZIP, którego używa zainstalowany Playwright; bez nowej zależności.
const { yauzl } = require(
  path.join(path.dirname(require.resolve("playwright-core/package.json")), "lib/utilsBundle.js"),
);
const limit = 24 * 1024 * 1024;
export const validPreviewId = (id) =>
  typeof id === "string" && /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(id) && id.length < 150;

export function redactPreview(value) {
  if (Array.isArray(value)) return value.map(redactPreview);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|authorization|cookie|secret|token/i.test(key)
          ? "[ukryto]"
          : redactPreview(item),
      ]),
    );
  if (typeof value !== "string") return value;
  return value
    .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, "g"), "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [ukryto]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[token ukryty]");
}

async function reportFiles(html) {
  const match = html.match(/data:application\/zip;base64,([^<]+)/);
  if (!match) return [];
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length > limit)
    throw new Error("Raport jest zbyt duży do szybkiego podglądu. Otwórz pełny raport.");
  return new Promise((resolve, reject) =>
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error) return reject(error);
      const files = [];
      let size = 0;
      zip.on("error", reject);
      zip.on("end", () => resolve(files));
      zip.on("entry", (entry) => {
        if (!entry.fileName.endsWith(".json")) return zip.readEntry();
        size += entry.uncompressedSize;
        if (size > limit) {
          zip.close();
          reject(new Error("Przekroczono limit danych podglądu."));
          return;
        }
        zip.openReadStream(entry, (err, stream) => {
          if (err) return reject(err);
          const chunks = [];
          stream.on("error", reject);
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => {
            try {
              files.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
              zip.readEntry();
            } catch (parseError) {
              zip.close();
              reject(parseError);
            }
          });
        });
      });
      zip.readEntry();
    }),
  );
}

export async function previewFromHtml(html, id, source = {}) {
  if (!validPreviewId(id)) throw new Error("Niepoprawne ID testu.");
  const files = await reportFiles(html);
  const test = files
    .flatMap((file) => file.tests ?? [])
    .find((item) => item.title.startsWith(`${id}:`) && item.results?.length);
  if (!test) return null;
  const result = test.results.at(-1);
  const metadata = files.find((file) => file.stats);
  let count = 0;
  const steps = (items, depth = 0) =>
    depth > 30
      ? []
      : (items ?? [])
          .slice(0, 3000)
          .map((step) => {
            if (++count > 10000) return null;
            return {
              title: step.title,
              duration: step.duration,
              error: step.error?.message || step.error?.value || "",
              skipped: Boolean(step.skipped),
              steps: steps(step.steps, depth + 1),
            };
          })
          .filter(Boolean);
  const attachments = (result.attachments ?? [])
    .slice(0, 150)
    .map((attachment) => {
      let body = attachment.body;
      if (attachment.contentType?.includes("json") && typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          /* Nie ukrywamy niepoprawnej treści JSON. */
        }
      }
      // Nie udostępniamy dowolnych ścieżek plików ani zawartości trace z nagłówkami sesji.
      const image =
        source.assetsBase &&
        /^image\/(png|jpeg)$/.test(attachment.contentType) &&
        /^data\/[a-zA-Z0-9._-]+$/.test(attachment.path ?? "")
          ? `${source.assetsBase}${attachment.path}`
          : null;
      return {
        name: attachment.name,
        contentType: attachment.contentType,
        body: typeof body === "string" ? body.slice(0, 160000) : body,
        image,
      };
    })
    .filter((attachment) => attachment.body !== undefined || attachment.image);
  return redactPreview({
    id,
    title: test.title,
    status: result.status,
    duration: result.duration,
    date: result.startTime ?? metadata?.startTime,
    attempt: result.retry ?? 0,
    steps: steps(result.steps),
    errors: (result.errors ?? []).map((e) => e.message || e.value || String(e)),
    attachments,
    environment: source.environment || "unknown",
    source: source.label || "Raport lokalny",
    reportUrl: source.reportUrl || null,
  });
}

export async function latestTestPreview(root, id, environment, history = []) {
  if (!validPreviewId(id)) throw new Error("Niepoprawne ID testu.");
  const reportRoot = path.join(root, "runs/html-reports");
  const dirs = await readdir(reportRoot, { withFileTypes: true }).catch(() => []);
  const candidates = await Promise.all(
    dirs
      .filter((dir) => dir.isDirectory() && /^[0-9a-f-]+$/i.test(dir.name))
      .map(async (dir) => {
        const known = history.find((run) => run.id === dir.name);
        if (known && known.environment !== environment) return null;
        const file = path.join(reportRoot, dir.name, "index.html");
        const info = await stat(file).catch(() => null);
        return (
          info && {
            file,
            modified: info.mtimeMs,
            environment: known?.environment,
            label: "Raport zapisanego przebiegu",
            reportUrl: `/report/${dir.name}/`,
            assetsBase: `/report/${dir.name}/`,
          }
        );
      }),
  );
  const cliFile = path.join(root, "playwright-report/index.html");
  const cli = await stat(cliFile).catch(() => null);
  if (cli)
    candidates.push({
      file: cliFile,
      modified: cli.mtimeMs,
      label: "Ostatni raport z terminala lub VS Code",
      reportUrl: "/latest-report/",
      assetsBase: "/latest-report/",
    });
  for (const candidate of candidates
    .filter(Boolean)
    .sort((a, b) => b.modified - a.modified)
    .slice(0, 40)) {
    try {
      if ((await stat(candidate.file)).size > limit * 2) continue;
      const preview = await previewFromHtml(await readFile(candidate.file, "utf8"), id, candidate);
      if (preview) return preview;
    } catch {
      /* Raport niekompletny (trwa zapis) nie zasłania starszego wyniku. */
    }
  }
  // Raporty przypięte wcześniej do zgłoszeń (np. z CLI) także są dostępne tylko do odczytu.
  try {
    const response = await fetch("http://127.0.0.1:4180/api/state", {
      signal: AbortSignal.timeout(1500),
    });
    const state = await response.json();
    const checks = (state.checks ?? [])
      .filter(
        (check) =>
          check.project === "octopus" &&
          String(check.environment).toLowerCase().startsWith(environment),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const check of checks.slice(0, 15)) {
      const attachment = check.attachments?.find(
        (item) => item.name.endsWith(".html") && /^[0-9a-f-]+$/i.test(item.id),
      );
      if (!attachment) continue;
      const url = `http://127.0.0.1:4180/attachments/${attachment.id}`;
      const saved = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (!saved.ok || Number(saved.headers.get("content-length")) > limit) continue;
      const preview = await previewFromHtml(await saved.text(), id, {
        environment,
        label: "Raport przypięty w Centrum testów",
        reportUrl: url,
      });
      if (preview) return preview;
    }
  } catch {
    /* Centrum testów nie jest wymagane do działania podglądu lokalnego. */
  }
  return null;
}
