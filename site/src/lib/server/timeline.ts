import generatedData from "../../generated/data.json";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import type { getEnhancedPosts } from "./posts";
import { leftPadTwoDigits } from "../formatting";
import type { getSvgDomain } from "./svg";

const getData = () => {
  return generatedData;
};

const getTimelineBounds = (dataFetcher = getData) => {
  const { dates } = dataFetcher();
  const headDate = dates[0];
  const tailDate = dates[dates.length - 1];
  const firstDate = startOfDay(parseISO(headDate));
  const lastDate = endOfDay(parseISO(tailDate));
  const firstDateVal = firstDate.valueOf();
  const lastDateVal = lastDate.valueOf();
  const realTimeDuration = lastDateVal - firstDateVal;
  return { firstDateVal, lastDateVal, realTimeDuration };
};

const graphStepDuration = 0.5 * 1_000;
const bookendStepCount = 2;

/**
 * primary logic for generating the animation sequencing / keyframes
 *
 * there's four separate animations happening:
 *
 * 1. an svg <path/> clipping transition for the filled line chart background
 * 2. svg <text/> keyframe animations for the day & killed count labels
 * 3. CSS keyframe animations for the post / statement cards
 * 4. CSS keyframe animation for the "display time" progress bar on each post card
 *
 * the aim is to have the following general progression:
 *
 * 1. chart fills until the next post time and stops
 * 2. during that graph "step", the counter labels count up for each day in that chart segment
 * 2. during the fill chart pause, a post shows and stays visible for an appropriate "read time" duration (progress bar fills during this time)
 * 3. chart starts filling again until the next post display time
 */
export const getTimeline = ({
  posts,
  svgDomain,
  dataFetcher,
}: {
  posts: ReturnType<typeof getEnhancedPosts>;
  svgDomain: ReturnType<typeof getSvgDomain>;
  dataFetcher?: typeof getData;
}) => {
  const { firstDateVal, realTimeDuration } = getTimelineBounds(dataFetcher);
  const { dates, killed } = dataFetcher ? dataFetcher() : getData();
  const postDates = posts.map((post) => post.dateValue).sort();
  const allDates = dates.map((date) => parseISO(date).valueOf());
  const uniqueDates = new Set<number>(postDates);
  const sortedMarkerTimes = Array.from(uniqueDates).sort();

  const postReadTimes = posts.reduce(
    (acc, post) => ({
      ...acc,
      totalReadTimeMs: acc.totalReadTimeMs + post.readTime.time,
      lookup: {
        ...acc.lookup,
        [post.dateValue]: post.readTime.time,
      },
    }),
    { totalReadTimeMs: 0, lookup: {} as Record<number, number> }
  );
  const expectedDuration =
    graphStepDuration * (posts.length + bookendStepCount) +
    postReadTimes.totalReadTimeMs;

  let startIndex = 0;
  const markerGroupStats = sortedMarkerTimes.reduce(
    (acc, postTime) => {
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

      const distance =
        (currentTimeInterval / realTimeDuration) * svgDomain.svgViewbox.width;

      const distanceBefore = acc.totalDistance;

      const progress = (postTime - firstDateVal) / realTimeDuration;
      const pathTravel = svgDomain.maxPathLength * progress;
      const markerPoint = svgDomain.pathPoints.at(pathTravel);
      const markerTooltip = format(postTime, "MMMM do yyyy");

      return {
        lastPostTime: postTime,
        totalDistance: acc.totalDistance + distance,
        steps: acc.steps.concat({
          postTime,
          dates: markerGroupStats.dates[postTime],
          killedCounts: markerGroupStats.killed[postTime],
          stepDurations: [graphStepDuration, postReadTimeLookup[postTime]], // graph timing, post read time
          distanceBefore,
          distance,
          markerPoint,
          markerTooltip,
        }),
      };
    },
    {
      lastPostTime: 0,
      totalDistance: 0,
      steps: [] as Array<{
        postTime: number;
        dates: string[];
        killedCounts: number[];
        stepDurations: [number, number];
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
      stepDurations: [graphStepDuration, 0],
      distance: remainingDistance,
      distanceBefore: graphConfig.totalDistance,
    });
  }

  //
  // for each post step, hold the post-step distance constant
  // so that the graph doesn't move while a post appears for reading
  //
  const clipPathValues = graphConfig.steps
    .map((step) =>
      [
        step.distance + step.distanceBefore,
        step.distance + step.distanceBefore,
      ].join(";")
    )
    .join(";");

  const postDelayLookup: Record<number, number> = {};
  const keyTimes: number[] = [];
  let keyTimeSum = 0;

  graphConfig.steps.forEach(
    ({ postTime, stepDurations: [graphTime, readTime] }, i) => {
      const stepSum = graphTime + readTime;

      if (!postDelayLookup[postTime]) {
        postDelayLookup[postTime] = keyTimeSum + graphTime;
      }

      if (i === 0) {
        keyTimes.push(0);
        keyTimes.push(stepSum / expectedDuration);
        keyTimeSum += stepSum;
      } else {
        keyTimeSum += graphTime;
        keyTimes.push(keyTimeSum / expectedDuration);
        if (readTime) {
          keyTimeSum += readTime;
          keyTimes.push(keyTimeSum / expectedDuration);
        } else {
          // last step has no readTime
          keyTimes.push(1);
        }
      }
    }
  );

  const clipPathTimes = keyTimes.join(";");

  const dayTexts: Array<{
    dayNumber: string;
    duration: number;
    dayAnimId: string;
    lastDayAnimId: string;
    noOpacity?: boolean;
    freeze: boolean;
  }> = [];
  const svgTexts: Array<{
    count: string;
    freeze: boolean;
    noOpacity?: boolean;
    countAnimId: string;
    countDuration: number;
    lastCountAnimId: string;
  }> = [];
  let lastCountAnimId = "";
  let lastDayAnimId = "";
  let dayNumber = 0;

  graphConfig.steps.forEach((step, stepIdx) => {
    const countDuration = step.stepDurations[0] / step.killedCounts.length;
    const stepId = stepIdx * 10;

    step.killedCounts.forEach((count, countIdx) => {
      const freeze =
        stepIdx + 1 === graphConfig.steps.length &&
        countIdx + 1 === step.killedCounts.length;

      const dayAnimId = `dayanim${stepId}${countIdx}`;
      dayNumber += 1;
      dayTexts.push({
        dayNumber: leftPadTwoDigits(dayNumber),
        duration: countDuration,
        dayAnimId,
        lastDayAnimId,
        freeze,
      });
      lastDayAnimId = dayAnimId;

      const countAnimId = `countanim${stepId}${countIdx}`;
      svgTexts.push({
        count: new Intl.NumberFormat().format(count),
        freeze,
        countAnimId,
        countDuration,
        lastCountAnimId,
      });
      lastCountAnimId = countAnimId;
    });

    // "animation" for the last count before a post shows to hold
    // the current values
    const dayAnimId = `dayanim${stepId}hold`;
    dayTexts.push({
      ...dayTexts[dayTexts.length - 1],
      dayAnimId,
      duration:
        step.stepDurations[1] +
        (step.killedCounts.length ? 0 : step.stepDurations[0]),
      lastDayAnimId,
      noOpacity: true,
    });
    lastDayAnimId = dayAnimId;
    const countAnimId = `countanim${stepId}hold`;
    svgTexts.push({
      ...svgTexts[svgTexts.length - 1],
      countAnimId,
      countDuration:
        step.stepDurations[1] +
        (step.killedCounts.length ? 0 : step.stepDurations[0]),
      lastCountAnimId,
      noOpacity: true,
    });
    lastCountAnimId = countAnimId;
  });

  return {
    graphConfig,
    dayTexts,
    svgTexts,
    clipPathTimes,
    clipPathValues,
    postDelayLookup,
    expectedDuration,
  };
};
