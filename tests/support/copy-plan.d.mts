export type CopyNode = "ZS" | "SP" | "LO" | "TECH" | "B" | "BSP" | "SOLO";
export type CopyPlan = { nodes: CopyNode[]; relations: Array<[CopyNode, CopyNode]> };
export const COPY_KEYS: Record<CopyNode, import("./school-structure-data").StructureSchoolKey>;
export const FULL_COPY_PLAN: CopyPlan;
export const ISOLATION_COPY_PLAN: CopyPlan;
export const STANDALONE_COPY_PLAN: CopyPlan;
export function copyPairPlan(source: CopyNode, target: CopyNode): CopyPlan;
export function validateCopyPlan(plan: CopyPlan): CopyPlan;
