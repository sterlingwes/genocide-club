import { parseISO, format } from "date-fns";
import readingTime from "reading-time";
import type { EnablerPost } from "../../schemas/enabler";
import type { StructuredText } from "../shared/structured-text";

const orderEarliestToLatest = (posts: EnablerPost[]) => {
  return posts.slice(0).sort((a, b) => {
    return parseISO(a.date).valueOf() - parseISO(b.date).valueOf();
  });
};

const naiveSingleUrlMatcher = /\s+(http[^\s]+)\s+/;

const displayUrlPathMaxLen = 12;
const shortPath = (path: string, prependDots = false) => {
  if (path.length <= displayUrlPathMaxLen + 6) {
    return path;
  }

  return `${prependDots ? "..." : ""}${path.slice(0, displayUrlPathMaxLen)}...`;
};

const formatDisplayUrl = (url: string) => {
  const [hostPart, ...rest] = url.replace(/https?:\/\//, "").split("/");
  return `${hostPart}${rest.length ? `/${shortPath(rest[rest.length - 1], rest.length > 1)}` : ""}`;
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
  // pad head & tail to ensure we capture any links at start or beginning given split regex
  return ` ${text} `
    .split(naiveSingleUrlMatcher)
    .filter((part) => !!part) // no empty strings
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

const wordsPerMinute = 250;

export const getEnhancedPosts = (posts: EnablerPost[]) => {
  return orderEarliestToLatest(posts)
    .filter((post) => !!post.tags.length)
    .map((post) => ({
      ...post,
      structuredText: post.text ? parsePostText(post.text) : [],
      structuredQuoteText: post.quote?.text
        ? parsePostText(post.quote.text)
        : [],
      // prefix locally-hosted images with correct path if not absolute
      ...(post.image && !post.image.startsWith("http")
        ? { image: `/post_assets/${post.image}` }
        : {}),
      ...(post.quote?.image && !post.quote.image.startsWith("http")
        ? {
            quote: { ...post.quote, image: `/post_assets/${post.quote.image}` },
          }
        : {}),
      readTime: readingTime(
        post.text +
          (post.quote ? " " + post.quote.text : "") +
          (post.imageCaption ? " " + post.imageCaption : "") +
          (post.quote?.imageCaption ? " " + post.quote.imageCaption : "") +
          (post.commentary ? " " + post.commentary : ""),
        {
          wordsPerMinute,
        }
      ),
      dateValue: parseISO(post.date).valueOf(),
      formattedDate: format(parseISO(post.date), "MMMM do yyyy"),
    }));
};
