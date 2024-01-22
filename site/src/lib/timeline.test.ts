import { expect, test } from "vitest";
import { getTimelineConfig, labelUpdateInterval } from "./timeline";

test("getTimelineConfig", () => {
  const durationSeconds = 120;
  const killedPerDay = [1000, 2000, 3000, 4000, 5000];
  const { dayDuration, postDelays, killedLabels } = getTimelineConfig({
    durationSeconds,
    posts: [
      { date: "2024-01-02" },
      { date: "2024-01-02T03:00:00.000Z" },
      { date: "2024-01-02T04:00:00.000Z" },
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
    killedPerDay,
  });
  expect(dayDuration).toBe(durationSeconds / 5);
  expect(postDelays).toEqual([24, 24.5, 25, 115, 120]);
  expect(killedLabels).toHaveLength(durationSeconds / labelUpdateInterval);
  expect(killedLabels[0]).toEqual(1000);
  expect(killedLabels[killedLabels.length - 1]).toEqual(5000);
});
