const svgPathLengthSearchTryLimit = 100;
const svgPathSearchStartLength = 475;

type SvgViewBox = { width: number; height: number };

const exportSvgPathApi = ({
  svgPath,
  maxPathLength,
  widthFactor,
  heightFactor,
}: {
  svgPath: SVGPathElement;
  maxPathLength: number;
  widthFactor: number;
  heightFactor: number;
}) => {
  return {
    getCoordinateForProgress: (progress: number) => {
      const pathLength = Math.round(maxPathLength * progress);
      const point = svgPath.getPointAtLength(pathLength);
      return [point.x * widthFactor, point.y * heightFactor];
    },
  };
};

const calculateSvgPathDomain = ({ svgViewbox }: { svgViewbox: SvgViewBox }) => {
  let topRightSvgPos;
  let maxPathLength;
  let tries = 0;
  const svgPath: SVGPathElement | null =
    document.querySelector("svg path#chartpath");
  if (!svgPath) {
    throw new Error("Could not select svg Path");
  }
  while (!topRightSvgPos && tries < svgPathLengthSearchTryLimit) {
    const point = svgPath.getPointAtLength(svgPathSearchStartLength + tries);
    if (Math.round(point.x) === svgViewbox.width && Math.round(point.y) === 0) {
      maxPathLength = svgPathSearchStartLength + tries;
      break;
    }
    tries++;
  }

  if (!maxPathLength) {
    throw new Error("Could not resolve maxPathLength");
  }

  const svg = document.querySelector("svg");
  if (!svg) {
    throw new Error("Could not select svg");
  }
  const svgBox = svg?.getBoundingClientRect();
  const widthFactor = svgBox.width / svgViewbox.width;
  const heightFactor = svgBox.height / svgViewbox.height;

  return exportSvgPathApi({
    svgPath,
    maxPathLength,
    widthFactor,
    heightFactor,
  });
};

const markerSize = 18;
const markerBorderRadius = markerSize / 2;

const exportMarkerApi = (markerMap: Map<number, HTMLElement>) => {
  return {
    showAll: () => {
      markerMap.forEach((marker) => {
        marker.style.opacity = "1";
      });
    },
    showOne: (dateVal: number) => {
      const match = markerMap.get(dateVal);
      if (match) {
        match.style.opacity = "1";
      }
    },
  };
};

export const setLineMarkersForPosts = ({
  minTime,
  maxTime,
  postDates,
  svgViewbox,
  markerHolder,
}: {
  minTime: number;
  maxTime: number;
  postDates: number[];
  svgViewbox: SvgViewBox;
  markerHolder: HTMLElement;
}) => {
  // clear existing before filling to allow for re-run
  markerHolder.innerHTML = "";

  const { getCoordinateForProgress } = calculateSvgPathDomain({ svgViewbox });
  const uniqueDates = new Set<number>(postDates);
  const markerMap = new Map<number, HTMLElement>();

  Array.from(uniqueDates).forEach((date) => {
    // calc marker position on svg path
    const progress = (date - minTime) / (maxTime - minTime);
    const [x, y] = getCoordinateForProgress(progress);

    // create, save & style marker
    const marker = document.createElement("div");
    markerMap.set(date, marker);
    marker.style.position = "absolute";
    marker.style.top = `${y - markerSize / 2}px`;
    marker.style.left = `${x - markerSize / 2}px`;
    marker.style.width = `${markerSize}px`;
    marker.style.height = `${markerSize}px`;
    marker.style.borderRadius = `${markerBorderRadius}px`;
    marker.style.backgroundColor = "rgb(137,49,46)";
    marker.style.zIndex = "200";
    marker.style.opacity = "0";
    marker.style.transition = "opacity 0.5s";
    markerHolder.appendChild(marker);
  });

  return exportMarkerApi(markerMap);
};
