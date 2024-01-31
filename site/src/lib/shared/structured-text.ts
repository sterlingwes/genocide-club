export type StructuredText =
  | { type: "text"; text: string }
  | { type: "para"; text: string }
  | { type: "url"; text: string; href: string }
  | { type: "space" }
  | { type: "break" };
