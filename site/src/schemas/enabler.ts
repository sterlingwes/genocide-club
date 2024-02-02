import { z } from "zod";
import { editorialTags } from "../lib/constants/editorial-tags";

/**
 * run "bun run gen-schemas" to update the matching JSON schema if changed
 */

export const schema = z.object({
  name: z.string(),
  bio: z.string(),
  tags: z.array(
    z.enum(["politician", "tech", "canada", "usa", "israel", "capital"])
  ),
  gender: z.enum(["m", "f", "nb"]),
  image: z.string().optional(),
  posts: z.array(
    z.object({
      type: z.enum(["twitter"]),
      href: z.string(),
      text: z.string().optional(),
      date: z.string(),
      image: z.string().optional(),
      imageCaption: z.string().optional(),
      commentary: z.string().optional(),
      tags: z.array(z.enum(editorialTags as [string, ...string[]])),
      quote: z
        .object({
          text: z.string(),
          author: z.string(),
          image: z.string().optional(),
          imageCaption: z.string().optional(),
        })
        .optional(),
    })
  ),
});

export const name = "enabler";

export type Enabler = z.infer<typeof schema>;
export type EnablerPost = Enabler["posts"][0];
