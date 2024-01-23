const cp = require("child_process");
const fs = require("fs");
const D3Node = require("d3-node");
const d3n = new D3Node();
const { d3 } = d3n;

const width = 400;
const height = 235;

const render = async () => {
  const svg = d3n
    .createSVG(width, height)
    .attr("viewBox", `0 0 ${width} ${height}`);
  const response = await fetch(
    "https://data.techforpalestine.org/api/v2/casualties_daily.json"
  );
  const data: Record<string, any[]> = (await response.json()).reduce(
    (acc, d, day) => ({
      ...acc,
      svgViewbox: {
        width,
        height,
      },
      days: acc.days.concat(day + 1),
      dates: acc.dates.concat(d.report_date),
      killed: acc.killed.concat(d.ext_killed_cum),
      chart: acc.chart.concat({
        date: d3.timeParse("%Y-%m-%d")(d.report_date),
        value: d.ext_killed_cum,
      }),
    }),
    { chart: [], days: [], dates: [], killed: [] }
  );

  var x = d3
    .scaleTime()
    .domain(
      d3.extent(data.chart, function (d) {
        return d.date;
      })
    )
    .range([0, width]);

  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data.chart, function (d) {
        return +d.value;
      }),
    ])
    .range([height, 0]);

  svg
    .append("path")
    .datum(data.chart)
    .attr("id", "chartpath")
    .attr("fill", "rgba(216, 56, 56, 0.3)")
    .attr("stroke", "rgba(168, 44, 44, 0.9)")
    .attr("stroke-width", 2)
    .attr("clip-path", "url(#curtain)")
    .attr(
      "d",
      d3
        .area()
        .x(function (d) {
          return x(d.date);
        })
        .y0(y(0))
        .y1(function (d) {
          return y(d.value);
        })
    );

  const defaultAnimationDuration = "10s";

  svg.attr("style", "width: 100vw; opacity: 0.9");
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "curtain")
    .append("rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", width)
    .attr("height", height)
    .append("animate")
    .attr("attributeName", "width")
    .attr("values", `0;${width}`)
    .attr("dur", defaultAnimationDuration)
    .attr("id", "svganim");

  const svgStr = d3n.svgString();
  const astroDoc = `---
interface Props {
  playDuration?: string
}
const { playDuration } = Astro.props;
---

${svgStr
  .replace(`width="${width}" height="${height}"`, "")
  .replace(
    `"${defaultAnimationDuration}"`,
    `{playDuration ?? "${defaultAnimationDuration}"}`
  )}
`;

  cp.execSync("mkdir -p site/src/generated");
  fs.writeFileSync("site/src/generated/killed.astro", astroDoc);

  delete data.chart;
  fs.writeFileSync("site/src/generated/data.json", JSON.stringify(data));
};

render();
