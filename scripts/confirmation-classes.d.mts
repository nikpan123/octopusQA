export function matchingConfirmationClasses<
  T extends { class: number; className: string; isOur: boolean },
>(
  boxes: T[],
  row: { classLevel: number; series: string; level: string; scope: string },
  own: boolean,
): T[];
