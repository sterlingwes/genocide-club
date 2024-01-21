import { defineCollection } from "astro:content";
import { enablerSchema } from "../schemas/enabler";

export const collections = {
  enabler: defineCollection({
    type: "content", // v2.5.0 and later
    schema: enablerSchema,
  }),
};
