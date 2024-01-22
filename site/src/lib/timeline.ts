import { endOfDay, parseISO, startOfDay } from "date-fns";

const oneDecimal = (value: number) => {
  return Math.round(value * 10) / 10;
};

export const defaultPlaybackDurationSeconds = 10;
export const labelUpdateInterval = 0.1; // seconds

const minimumPostDelaySeconds = 0.5;

export const getTimelineConfig = ({
  durationSeconds,
  posts,
  dates,
  killedPerDay,
}: {
  durationSeconds: number | undefined;
  posts: Array<{ date: string }>;
  dates: string[];
  killedPerDay: number[];
}) => {
  const days = dates.length;
  const playDuration = durationSeconds ?? defaultPlaybackDurationSeconds;
  const dayDuration = oneDecimal(playDuration / days);
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
    if (delaySeconds - lastDelay < minimumPostDelaySeconds) {
      delaySeconds = lastDelay + minimumPostDelaySeconds;
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

  return { dayDuration, postDelays, killedLabels, labelUpdateIntervalMs };
};
