export const leftPadTwoDigits = (n: number): string => {
  if (n < 10) {
    return `00${n}`;
  }

  if (n < 100) {
    return `0${n}`;
  }

  return `${n}`;
};
