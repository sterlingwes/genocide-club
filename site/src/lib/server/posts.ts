import { parseISO, format } from "date-fns";
import readingTime from "reading-time";
import type { EnablerPost } from "../../schemas/enabler";

const orderEarliestToLatest = (posts: EnablerPost[]) => {
  return posts.slice(0).sort((a, b) => {
    return parseISO(a.date).valueOf() - parseISO(b.date).valueOf();
  });
};

export const getEnhancedPosts = (posts: EnablerPost[]) => {
  return orderEarliestToLatest(posts)
    .filter((post) => !post.skip)
    .map((post) => ({
      ...post,
      readTime: readingTime(post.text + (post.quote ? post.quote.text : "")),
      dateValue: parseISO(post.date).valueOf(),
      formattedDate: format(parseISO(post.date), "MMMM do yyyy"),
    }));
};
