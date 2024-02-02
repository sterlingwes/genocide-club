import type { StructuredText } from "../shared/structured-text";
import strings from "./strings.json";

const isStructuredText = (part: any): part is StructuredText => {
  return typeof part === "object" && typeof part.type === "string";
};

export const getRawString = (key: keyof typeof strings) => {
  return strings[key];
};

export const getString = (key: keyof typeof strings) => {
  const value = strings[key];
  if (!value) {
    throw new Error(`No match for string lookup by key: ${key}`);
  }

  if (isStructuredText(value)) {
    return value as StructuredText;
  }

  return { type: "text" as const, text: value };
};

export const getStrings = (...keys: Array<keyof typeof strings>) => {
  return keys.map((key) => getString(key));
};
