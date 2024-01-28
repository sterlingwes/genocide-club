// @ts-expect-error no types in lib
import pathPoint from "point-at-length";
import generatedData from "../../generated/data.json";

export const getSvgDomain = () => {
  const { pathData, svgViewbox } = generatedData;
  const aspectRatio = svgViewbox.width / svgViewbox.height;

  const pathPoints = pathPoint(pathData);

  // calc svg domain
  let topRightSvgPos;
  let maxPathLength = 0;
  let tries = 0;

  const svgPathLengthSearchTryLimit = 100;
  const svgPathSearchStartLength = 475;

  while (!topRightSvgPos && tries < svgPathLengthSearchTryLimit) {
    const point = pathPoints.at(svgPathSearchStartLength + tries);
    if (
      Math.round(point[0]) === svgViewbox.width &&
      Math.round(point[1]) === 0
    ) {
      maxPathLength = svgPathSearchStartLength + tries;
      break;
    }
    tries++;
  }

  if (!maxPathLength) {
    throw new Error("Could not resolve maxPathLength");
  }

  return { maxPathLength, pathPoints, aspectRatio, svgViewbox };
};
