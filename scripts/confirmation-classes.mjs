const normalize = (name) =>
  name
    .normalize("NFD")
    .replace(/\p{M}|\s/gu, "")
    .toUpperCase();

export function matchingConfirmationClasses(boxes, row, own) {
  const candidates = boxes.filter((box) => box.class === row.classLevel && box.isOur === own);
  // Foreign confirmations use the generic class, without our series selection.
  if (!own) return candidates;
  if (row.series === "MN" && row.level === "SP") {
    // The form can expose both "4" and "4 Między N". Prefer the named series;
    // returning all exact matches preserves the caller's duplicate validation.
    const named = candidates.filter((box) => normalize(box.className).includes("MIEDZYN"));
    return named.length
      ? named
      : candidates.filter((box) => normalize(box.className) === String(row.classLevel));
  }
  return candidates.filter((box) => {
    const name = normalize(box.className);
    if (row.series === "TNS") return name.includes("TNS");
    if (row.series === "FPLUS") return !name.includes("TNS");
    if (row.series === "MZ") return name.includes("MZ") || name.includes("MOIM");
    if (row.scope) return name === `${row.classLevel}${row.scope}`;
    return true;
  });
}
