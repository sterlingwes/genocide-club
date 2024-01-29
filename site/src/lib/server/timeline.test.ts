import MockDate from "mockdate";
import { afterAll, beforeAll, expect, test } from "vitest";
import { getTimeline } from "./timeline";
import { getSvgDomain } from "./svg";
import { getEnhancedPosts } from "./posts";
import dataFixture from "./__fixtures__/data.json";

test("timeline datamodel integration", () => {
  beforeAll(() => {
    MockDate.set(new Date(2023, 12, 31, 23, 0, 0, 0));
  });

  afterAll(() => MockDate.reset());

  const posts = getEnhancedPosts(
    require("../../content/enabler/talbroda.json").posts
  );
  const svgDomain = getSvgDomain();
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
