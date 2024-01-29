import { expect, test } from "vitest";
import { getTimeline } from "./timeline";
import { getSvgDomain } from "./server/svg";
import { getEnhancedPosts } from "./server/posts";

test("timeline datamodel integration", () => {
  const posts = getEnhancedPosts(
    require("../content/enabler/talbroda.json").posts
  );
  const svgDomain = getSvgDomain();
  const timeline = getTimeline({ svgDomain, posts });
  expect(timeline).toMatchSnapshot();

  expect(timeline.clipPathTimes.split(";")).toHaveLength(
    timeline.clipPathValues.split(";").length
  );
});
