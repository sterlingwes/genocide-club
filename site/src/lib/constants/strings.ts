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

const replaceVars = (
  part: { type: string; text?: string },
  vars: Record<string, any>
) => {
  if (part.type !== "text" || !part.text) {
    throw new Error("replaceVars called with non-text structured type");
  }

  return {
    type: "text" as const,
    text: Object.keys(vars).reduce((acc, key) => {
      return acc.replace(`{{${key}}}`, vars[key]);
    }, part.text),
  };
};

export const getStrings = (...keys: Array<keyof typeof strings>) => {
  return keys.map((key) => getString(key));
};

export const getReplacedString = (
  key: keyof typeof strings,
  vars: Record<string, any>
): { type: "text"; text: string } => replaceVars(getString(key), vars);
