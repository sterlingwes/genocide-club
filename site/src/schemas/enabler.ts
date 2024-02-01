import { z } from "zod";

/**
 * run "bun run gen-schemas" to update the matching JSON schema if changed
 */

export const schema = z.object({
  name: z.string(),
  bio: z.string(),
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
      skip: z.boolean().optional(),
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
