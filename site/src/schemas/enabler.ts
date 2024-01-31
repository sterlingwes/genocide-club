import { z } from "astro:content";

export const enablerSchema = z.object({
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

export type Enabler = z.infer<typeof enablerSchema>;
export type EnablerPost = Enabler["posts"][0];
