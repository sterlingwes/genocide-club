import generatedData from "../generated/data.json";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import type { getEnhancedPosts } from "./server/posts";
import { leftPadTwoDigits } from "./formatting";
import type { getSvgDomain } from "./server/svg";

const oneDecimal = (value: number) => {
  return Math.round(value * 10) / 10;
};

export const defaultPlaybackDurationSeconds = 10;
export const labelUpdateInterval = 0.1; // seconds

// if posts presented in within this time period (in seconds)
// just show them at the same time as the one(s) prior
const postConsolidationThreshold = 0.5;

const { dates, killed } = generatedData;

const minimumPostTime = 3 * 1_000;
const minimumTotalAnimTime = 10 * 1_000;
const minimumDayDuration = minimumTotalAnimTime / dates.length;

const getTimelineBounds = () => {
  const firstDate = startOfDay(parseISO(dates[0]));
  const lastDate = endOfDay(parseISO(dates[dates.length - 1]));
  const firstDateVal = firstDate.valueOf();
  const lastDateVal = lastDate.valueOf();
  const realTimeDuration = lastDateVal - firstDateVal;
  return { firstDateVal, lastDateVal, realTimeDuration };
};

export const getTimeline = ({
  posts,
  svgDomain,
}: {
  posts: ReturnType<typeof getEnhancedPosts>;
  svgDomain: ReturnType<typeof getSvgDomain>;
}) => {
  const { firstDateVal, realTimeDuration } = getTimelineBounds();
  const postDates = posts.map((post) => post.dateValue).sort();
  const allDates = dates.map((date) => parseISO(date).valueOf());
  const uniqueDates = new Set<number>(postDates);
  const sortedMarkerTimes = Array.from(uniqueDates).sort();

  let startIndex = 0;
  const markerGroupStats = sortedMarkerTimes.reduce(
    (acc, postTime, i) => {
      const lastIndex = allDates.findIndex((dateVal) => dateVal > postTime);
      const dates = allDates
        .slice(startIndex, lastIndex)
        .map((dateVal) => format(dateVal, "yyyy-MM-dd"));
      const killedCounts = killed.slice(startIndex, lastIndex);
      startIndex = lastIndex;
      return {
        ...acc,
        killed: {
          ...acc.killed,
          [postTime]: killedCounts,
        },
        dates: {
          ...acc.dates,
          [postTime]: dates,
        },
      };
    },
    {
      killed: {} as Record<number, number[]>,
      dates: {} as Record<number, string[]>,
    }
  );

  const postReadTimeLookup: Record<number, number> = posts.reduce(
    (acc, post) => ({
      ...acc,
      [post.dateValue]: post.readTime.time,
    }),
    {}
  );

  const graphConfig = sortedMarkerTimes.reduce(
    (acc, postTime) => {
      const currentTimeInterval = acc.lastPostTime
        ? postTime - acc.lastPostTime
        : postTime - firstDateVal;

      //
      // TODO: refactor graph segments into "without posts" and "posts"
      // ie: graph stops moving when a post is showing and starts again
      // for the periods in between
      //

      const duration = Math.max(
        minimumDayDuration,
        minimumPostTime,
        postReadTimeLookup[postTime] ?? 0
      );
      const distance =
        (currentTimeInterval / realTimeDuration) * svgDomain.svgViewbox.width;

      const distanceBefore = acc.totalDistance;

      const progress = (postTime - firstDateVal) / realTimeDuration;
      const pathTravel = svgDomain.maxPathLength * progress;
      const markerPoint = svgDomain.pathPoints.at(pathTravel);
      const markerTooltip = format(postTime, "MMMM do yyyy");

      return {
        lastPostTime: postTime,
        totalDuration: acc.totalDuration + duration,
        totalDistance: acc.totalDistance + distance,
        postDelayLookup: {
          ...acc.postDelayLookup,
          [postTime]: (acc.totalDuration + duration) / 1_000,
        },
        steps: acc.steps.concat({
          postTime,
          dates: markerGroupStats.dates[postTime],
          killedCounts: markerGroupStats.killed[postTime],
          durationBefore: acc.totalDuration,
          duration,
          distanceBefore,
          distance,
          markerPoint,
          markerTooltip,
        }),
      };
    },
    {
      lastPostTime: 0,
      totalDuration: 0,
      totalDistance: 0,
      postDelayLookup: {} as Record<number, number>,
      steps: [] as Array<{
        postTime: number;
        dates: string[];
        killedCounts: number[];
        durationBefore: number;
        duration: number;
        distanceBefore: number;
        distance: number;
        markerPoint?: [number, number];
        markerTooltip?: string;
      }>,
    }
  );

  const remainingDistance =
    svgDomain.svgViewbox.width - graphConfig.totalDistance;
  if (remainingDistance > 0) {
    graphConfig.steps.push({
      postTime: 0,
      dates: allDates.slice(startIndex).map((dt) => format(dt, "yyyy-MM-dd")),
      killedCounts: killed.slice(startIndex),
      distance: remainingDistance,
      distanceBefore: graphConfig.totalDistance,
      durationBefore: graphConfig.totalDuration,
      duration: minimumPostTime,
    });
    graphConfig.totalDuration += minimumPostTime;
  }

  const dayTexts: Array<{
    dayNumber: string;
    duration: number;
    dayAnimId: string;
    lastDayAnimId: string;
    freeze: boolean;
  }> = [];
  const svgTexts: Array<{
    count: string;
    freeze: boolean;
    countAnimId: string;
    countDuration: number;
    lastCountAnimId: string;
  }> = [];
  let lastCountAnimId = "";
  let lastDayAnimId = "";
  graphConfig.steps.forEach((step, stepIdx) => {
    const countDuration = step.duration / step.killedCounts.length;

    step.killedCounts.forEach((count, countIdx) => {
      const freeze =
        stepIdx + 1 === graphConfig.steps.length &&
        countIdx + 1 === step.killedCounts.length;

      const dayAnimId = `dayanim${stepIdx}${countIdx}`;
      dayTexts.push({
        dayNumber: leftPadTwoDigits(dayTexts.length + 1),
        duration: countDuration,
        dayAnimId,
        lastDayAnimId,
        freeze,
      });
      lastDayAnimId = dayAnimId;

      const countAnimId = `countanim${stepIdx}${countIdx}`;
      svgTexts.push({
        count: new Intl.NumberFormat().format(count),
        freeze,
        countAnimId,
        countDuration,
        lastCountAnimId,
      });
      lastCountAnimId = countAnimId;
    });
  });

  return { graphConfig, dayTexts, svgTexts };
};

export const getTimelineConfig = ({
  durationSeconds,
  posts,
  dates,
  killedPerDay,
  wcKilledPerDay,
}: {
  durationSeconds: number | undefined;
  posts: Array<{ date: string }>;
  dates: string[];
  killedPerDay: number[];
  wcKilledPerDay: number[];
}) => {
  const days = dates.length;
  const playDuration = durationSeconds ?? defaultPlaybackDurationSeconds;
  const dayDuration = playDuration / days;
  const firstDate = startOfDay(parseISO(dates[0]));
  const lastDate = endOfDay(parseISO(dates[dates.length - 1]));
  const firstDateVal = firstDate.valueOf();
  const lastDateVal = lastDate.valueOf();
  if (isNaN(firstDateVal) || isNaN(lastDateVal)) {
    throw new Error("Invalid first or last date in dates to getTimelineConfig");
  }

  const dateIntervals = dates.map((date) => parseISO(date).valueOf());
  const findNextDateIndex = (time: number) =>
    dateIntervals.findIndex((dateVal) => dateVal > time);

  //
  // calculate delay offset for each post appearance
  //

  const millisecondsBetween = lastDateVal - firstDateVal;
  let lastDelay = 0;
  const postDelays = posts.map((post, i) => {
    const postDate = parseISO(post.date);
    if (isNaN(postDate.valueOf())) {
      throw new Error(
        `Post (#${i}) has invalid date format: ${post.date} (require ISO)`
      );
    }

    const millisecondsIn = postDate.valueOf() - firstDateVal;
    let delaySeconds = oneDecimal(
      (millisecondsIn / millisecondsBetween) * playDuration
    );
    if (delaySeconds - lastDelay < postConsolidationThreshold) {
      delaySeconds = lastDelay;
    }
    lastDelay = delaySeconds;
    return delaySeconds;
  });

  //
  // calculate steps for each graph label we're updating
  //
  const labelUpdates = Math.round(playDuration / labelUpdateInterval);
  const labelRealTimeStep = Math.round(millisecondsBetween / labelUpdates);
  const labelIterator = Array.from(new Array(labelUpdates));
  const labelUpdateIntervalMs = labelUpdateInterval * 1000;
  const killedLabels = labelIterator.map((_, index) => {
    const stepTime = index * labelRealTimeStep + firstDateVal;
    let nextDay = findNextDateIndex(stepTime);
    if (nextDay === -1) {
      nextDay = dateIntervals.length;
    }
    const stepTimeLow = dateIntervals[nextDay - 1];
    const stepTimeHigh = dateIntervals[nextDay];
    const stepValueLow = killedPerDay[nextDay - 1];
    const stepValueHigh = killedPerDay[nextDay];

    if (!stepValueHigh || !stepTimeHigh) {
      return stepValueLow;
    }

    const progressBetween =
      (stepTime - stepTimeLow) / (stepTimeHigh - stepTimeLow);

    if (progressBetween >= 0.9) {
      return stepValueHigh;
    }

    const stepDistance = Math.round(
      (stepValueHigh - stepValueLow) * progressBetween
    );
    return stepValueLow + stepDistance;
  });

  const wcKilledLabels = labelIterator.map((_, index) => {
    const stepTime = index * labelRealTimeStep + firstDateVal;
    let nextDay = findNextDateIndex(stepTime);
    if (nextDay === -1) {
      nextDay = dateIntervals.length;
    }
    const stepTimeLow = dateIntervals[nextDay - 1];
    const stepTimeHigh = dateIntervals[nextDay];
    const stepValueLow = wcKilledPerDay[nextDay - 1];
    const stepValueHigh = wcKilledPerDay[nextDay];

    if (!stepValueHigh || !stepTimeHigh) {
      return stepValueLow;
    }

    const progressBetween =
      (stepTime - stepTimeLow) / (stepTimeHigh - stepTimeLow);

    if (progressBetween >= 0.9) {
      return stepValueHigh;
    }

    const stepDistance = Math.round(
      (stepValueHigh - stepValueLow) * progressBetween
    );
    return stepValueLow + stepDistance;
  });

  return {
    dayDuration,
    postDelays,
    killedLabels,
    wcKilledLabels,
    labelUpdateIntervalMs,
    firstDateVal,
    lastDateVal,
  };
};
