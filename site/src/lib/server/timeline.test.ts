import { expect, test } from "vitest";
import { getTimeline } from "./timeline";
import { getSvgDomain } from "./svg";
import { getEnhancedPosts } from "./posts";
import dataFixture from "./__fixtures__/data.json";

test("timeline datamodel integration", () => {
  const posts = getEnhancedPosts(
    require("../../content/enabler/tal-broda.json").posts
  );

  const dataFetcher = () => dataFixture;

  const svgDomain = getSvgDomain();
  const timeline = getTimeline({
    svgDomain,
    posts,
    dataFetcher,
  });
  expect(timeline).toMatchSnapshot();

  expect(timeline.clipPathTimes.split(";")).toHaveLength(
    timeline.clipPathValues.split(";").length
  );
});
