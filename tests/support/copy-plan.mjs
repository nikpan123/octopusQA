// Osobny zestaw dla całego pakietu kopiowania. Stare szkoły COPY_* pozostają
// nietknięte: mogą zawierać relacje utworzone poza bieżącym wykonaniem testów.
// Dane topologii pozostają jawne: testy hierarchii zachowują pełny graf ZS.
export const COPY_KEYS = {
  ZS: "specCopyGroup",
  SP: "specCopyPrimary",
  LO: "specCopySecondary",
  TECH: "specCopyTechnical",
  B: "specCopyOtherGroup",
  BSP: "specCopyOtherPrimary",
  SOLO: "specCopyStandalone",
};
export const FULL_COPY_PLAN = {
  nodes: ["ZS", "SP", "LO", "TECH"],
  relations: [
    ["ZS", "SP"],
    ["SP", "LO"],
    ["ZS", "TECH"],
  ],
};
export const ISOLATION_COPY_PLAN = {
  nodes: [...FULL_COPY_PLAN.nodes, "B", "BSP", "SOLO"],
  relations: [...FULL_COPY_PLAN.relations, ["B", "BSP"]],
};
export const STANDALONE_COPY_PLAN = { nodes: ["SOLO"], relations: [] };

export function validateCopyPlan(plan) {
  if (!plan || !Array.isArray(plan.nodes) || !plan.nodes.length || !Array.isArray(plan.relations))
    throw new Error("Niepełny plan danych kopiowania.");
  const nodes = new Set(plan.nodes);
  if (
    nodes.size !== plan.nodes.length ||
    plan.nodes.some((node) => !Object.hasOwn(COPY_KEYS, node))
  )
    throw new Error("Niepoprawne placówki planu kopiowania.");
  const relations = new Set();
  for (const edge of plan.relations) {
    if (
      !Array.isArray(edge) ||
      edge.length !== 2 ||
      edge[0] === edge[1] ||
      edge.some((node) => !nodes.has(node))
    )
      throw new Error("Relacja poza planem kopiowania.");
    const key = edge.join(":");
    if (relations.has(key)) throw new Error("Powtórzona relacja kopiowania.");
    relations.add(key);
  }
  return plan;
}

export function copyPairPlan(source, target) {
  if (!Object.hasOwn(COPY_KEYS, source) || !Object.hasOwn(COPY_KEYS, target) || source === target)
    throw new Error("Para kopiowania wymaga dwóch różnych znanych placówek.");
  // Zachowujemy kierunek relacji i pośrednie poziomy, zamiast zmieniać rodzeństwo w rodzica/dziecko.
  const queue = [[source]];
  const visited = new Set();
  while (queue.length) {
    const route = queue.shift();
    const current = route.at(-1);
    if (current === target) {
      const selected = new Set(route);
      return validateCopyPlan({
        nodes: ISOLATION_COPY_PLAN.nodes.filter((node) => selected.has(node)),
        relations: ISOLATION_COPY_PLAN.relations.filter((edge) =>
          edge.every((node) => selected.has(node)),
        ),
      });
    }
    if (visited.has(current)) continue;
    visited.add(current);
    for (const [parent, child] of ISOLATION_COPY_PLAN.relations) {
      const next = parent === current ? child : child === current ? parent : null;
      if (next && !visited.has(next)) queue.push([...route, next]);
    }
  }
  throw new Error("Placówki nie należą do tej samej struktury planu.");
}
