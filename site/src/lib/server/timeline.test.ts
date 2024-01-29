import { expect, test } from "vitest";
import { getTimeline } from "./timeline";
import { getSvgDomain } from "./svg";
import { getEnhancedPosts } from "./posts";
import dataFixture from "./__fixtures__/data.json";

test("timeline datamodel integration", () => {
  const posts = getEnhancedPosts(
    require("../../content/enabler/talbroda.json").posts
  );
  const svgDomain = getSvgDomain(() => dataFixture);
  const timeline = getTimeline({
    svgDomain,
    posts,
    dataFetcher: () => dataFixture,
  });
  expect(timeline).toMatchSnapshot();

  expect(timeline.clipPathTimes.split(";")).toHaveLength(
    timeline.clipPathValues.split(";").length
  );
});
