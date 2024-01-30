import { parseISO, format } from "date-fns";
import readingTime from "reading-time";
import type { EnablerPost } from "../../schemas/enabler";

const orderEarliestToLatest = (posts: EnablerPost[]) => {
  return posts.slice(0).sort((a, b) => {
    return parseISO(a.date).valueOf() - parseISO(b.date).valueOf();
  });
};

type StructuredText =
  | { type: "text"; text: string }
  | { type: "url"; text: string; href: string }
  | { type: "space" }
  | { type: "break" };

const naiveSingleUrlMatcher = /\s+(http[^\s]+)\s+/;

const formatDisplayUrl = (url: string) => {
  const [hostPart, ...rest] = url.replace(/https?:\/\//, "").split("/");
  return `${hostPart}${rest.length ? `/...${rest[rest.length - 1]}` : ""}`;
};

const splitLinebreaks = (part: StructuredText) => {
  if (part.type !== "text") {
    return part;
  }

  const parts = part.text.split(/\n/);
  if (parts.length === 1) {
    return part;
  }

  return parts.reduce(
    (acc, part, i) =>
      parts.length - 1 !== i
        ? acc.concat({ type: "text", text: part }).concat({ type: "break" })
        : acc.concat({ type: "text", text: part }),
    [] as StructuredText[]
  );
};

const parsePostText = (text: string): StructuredText[] => {
  return text
    .split(naiveSingleUrlMatcher)
    .map(
      (part): StructuredText =>
        typeof part === "object"
          ? part
          : part.startsWith("http")
            ? { type: "url", text: formatDisplayUrl(part), href: part }
            : { type: "text", text: part }
    )
    .reduce(
      (acc, part, i, allValues) =>
        allValues.length - 1 !== i
          ? acc.concat(splitLinebreaks(part)).concat({ type: "space" })
          : acc.concat(splitLinebreaks(part)),
      [] as StructuredText[]
    );
};

export const getEnhancedPosts = (posts: EnablerPost[]) => {
  return orderEarliestToLatest(posts)
    .filter((post) => !post.skip)
    .map((post) => ({
      ...post,
      structuredText: parsePostText(post.text),
      structuredQuoteText: post.quote?.text
        ? parsePostText(post.quote.text)
        : [],
      readTime: readingTime(post.text + (post.quote ? post.quote.text : ""), {
        wordsPerMinute: 300,
      }),
      dateValue: parseISO(post.date).valueOf(),
      formattedDate: format(parseISO(post.date), "MMMM do yyyy"),
    }));
};
