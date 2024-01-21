import { endOfDay, parseISO, startOfDay } from "date-fns";

const oneDecimal = (value: number) => {
  return Math.round(value * 10) / 10;
};

export const defaultPlaybackDurationSeconds = 10;

export const getTimelineConfig = ({
  durationSeconds,
  posts,
  dates,
}: {
  durationSeconds: number | undefined;
  posts: Array<{ date: string }>;
  dates: string[];
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

  const millisecondsBetween = lastDateVal - firstDateVal;
  const postDelays = posts.map((post, i) => {
    const postDate = parseISO(post.date);
    if (isNaN(postDate.valueOf())) {
      throw new Error(
        `Post (#${i}) has invalid date format: ${post.date} (require ISO)`
      );
    }

    const millisecondsIn = postDate.valueOf() - firstDateVal;
    const delaySeconds = oneDecimal(
      (millisecondsIn / millisecondsBetween) * playDuration
    );
    return delaySeconds;
  });

  return { dayDuration, postDelays };
};
