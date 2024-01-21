import { defineCollection } from "astro:content";
import { enablerSchema } from "../schemas/enabler";

export const collections = {
  enabler: defineCollection({
    type: "data",
    schema: enablerSchema,
  }),
};
