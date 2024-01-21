import { expect, test } from "vitest";
import { getTimelineConfig } from "./timeline";

test("getTimelineConfig", () => {
  const { dayDuration, postDelays } = getTimelineConfig({
    durationSeconds: 120,
    posts: [
      { date: "2024-01-02" },
      { date: "2024-01-05T23:59:00.000Z" }, // end of Jan 5th in EST
      { date: "2024-01-06T04:59:00.000Z" }, // end of Jan 5th in UTC
    ],
    dates: [
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
      "2024-01-04",
      "2024-01-05",
    ],
  });
  expect(dayDuration).toBe(120 / 5);
  expect(postDelays).toEqual([24, 115, 120]);
});
