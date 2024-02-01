import { defineCollection } from "astro:content";
import { schema } from "../schemas/enabler";

export const collections = {
  enabler: defineCollection({
    type: "data",
    schema,
  }),
};
