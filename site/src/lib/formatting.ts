export const leftPadTwoDigits = (n: number): string => {
  if (n < 10) {
    return `00${n}`;
  }

  if (n < 100) {
    return `0${n}`;
  }

  return `${n}`;
};

export const properCase = (str: string) =>
  `${str[0].toUpperCase()}${str.slice(1)}`;

export const getPossessivePronoun = (gender: "m" | "f" | "nb") => {
  switch (gender) {
    case "m":
      return "his";
    case "f":
      return "her";
    default:
      return "their";
  }
};

export const imgUrl = (url: string) => {
  if (url.startsWith("agc://")) {
    return url.replace(/^agc:\/\/\/?/, "https://assets.genocide.club/");
  }

  return url;
};
