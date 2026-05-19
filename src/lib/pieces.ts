// Corporate piece naming
export const pieceName: Record<string, "Intern" | "Marketer" | "HR" | "Developer" | "COO" | "CEO"> = {
  p: "Intern",
  n: "Marketer",
  b: "HR",
  r: "Developer",
  q: "COO",
  k: "CEO",
};

export function sanToCorporate(san: string, t: (k: any) => string): string {
  // san like "Nf3", "e4", "Qxd5", "O-O", "O-O-O"
  if (!san) return san;
  if (san.startsWith("O-O")) return san;
  const first = san[0];
  const map: Record<string, string> = {
    N: t("Marketer"),
    B: t("HR"),
    R: t("Developer"),
    Q: t("COO"),
    K: t("CEO"),
  };
  if (map[first]) return `${map[first]} ${san.slice(1)}`;
  return `${t("Intern")} ${san}`;
}
