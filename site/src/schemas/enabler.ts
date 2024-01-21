import { z } from "astro:content";

export const enablerSchema = z.object({
  name: z.string(),
  bio: z.string(),
  image: z.string().optional(),
  playDurationSeconds: z.number().optional(),
  posts: z.array(
    z.object({
      text: z.string(),
      date: z.string(),
      skip: z.boolean().optional(),
    })
  ),
});

export type Enabler = z.infer<typeof enablerSchema>;
export type EnablerPost = Enabler["posts"][0];
