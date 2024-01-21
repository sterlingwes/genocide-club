import { parseISO } from "date-fns";
import type { EnablerPost } from "../schemas/enabler";

export const orderEarliestToLatest = (posts: EnablerPost[]) => {
  return posts.slice(0).sort((a, b) => {
    return parseISO(a.date).valueOf() - parseISO(b.date).valueOf();
  });
};
