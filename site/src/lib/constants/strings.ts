import type { StructuredText } from "../shared/structured-text";
import strings from "./strings.json";

export const getString = (key: keyof typeof strings) => {
  if (!strings[key]) {
    throw new Error(`No match for string lookup by key: ${key}`);
  }
  return strings[key] as StructuredText;
};
