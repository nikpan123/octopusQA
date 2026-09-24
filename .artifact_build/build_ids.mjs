import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const ids = [
  "533265", "533263", "533262", "533260", "533257", "533224", "533221",
  "533156", "533135", "533125", "533057", "533056", "533055", "533054",
  "533053", "533052", "533051", "533050", "533049", "533048", "533047",
  "533046", "533045", "533044", "533043", "533042", "533041", "533040",
  "533039", "533038", "533037", "533036", "533035", "533034", "533033",
  "533032", "533031", "533030", "533029", "533028", "533027", "533026",
  "533025", "533024", "533023", "533022", "533021", "533020", "533019",
  "533018", "533017", "533016", "533015", "532980", "532975", "532950",
  "532909", "532907", "532906", "532900", "532877", "532868", "532856",
  "532850", "532849", "532848", "532847", "532846", "532845", "532844",
  "532843", "532842", "532838", "532833", "532829", "532825",
];

if (ids.length !== new Set(ids).size) throw new Error("Lista zawiera duplikaty.");

const outputDir = "outputs/unique-ids";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("ID");
sheet.showGridLines = false;
sheet.getRange("A1").values = [["ID"]];
sheet.getRange(`A2:A${ids.length + 1}`).values = ids.map((id) => [id]);
sheet.getRange(`A1:A${ids.length + 1}`).format.font = { name: "Arial", size: 10 };
sheet.getRange("A1").format = {
  fill: "#1F4E78",
  font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: "#1F4E78" },
};
sheet.getRange(`A2:A${ids.length + 1}`).format.numberFormat = "@";
sheet.getRange(`A2:A${ids.length + 1}`).format.horizontalAlignment = "right";
sheet.getRange(`A1:A${ids.length + 1}`).format.columnWidth = 14;
sheet.getRange("A1").format.rowHeight = 22;
sheet.freezePanes.freezeRows(1);

workbook.recalculate();

const inspection = await workbook.inspect({
  kind: "table",
  range: `ID!A1:A${ids.length + 1}`,
  include: "values,formulas",
  tableMaxRows: 100,
  tableMaxCols: 2,
});
console.log(inspection.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 50 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/unikalne_id.xlsx`);
console.log(JSON.stringify({ output: `${outputDir}/unikalne_id.xlsx`, count: ids.length }));

const saved = await SpreadsheetFile.importXlsx(await FileBlob.load(`${outputDir}/unikalne_id.xlsx`));
const savedValues = saved.worksheets.getItem("ID").getRange(`A2:A${ids.length + 1}`).values.flat();
if (savedValues.length !== ids.length || new Set(savedValues).size !== ids.length) {
  throw new Error("Kontrola zapisanej wersji wykryła nieprawidłową liczbę ID lub duplikaty.");
}
console.log(JSON.stringify({ verifiedSavedRows: savedValues.length, verifiedUniqueRows: new Set(savedValues).size }));

const preview = await workbook.render({ sheetName: "ID", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));
