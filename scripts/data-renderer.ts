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
  const data: {
    chart: Array<{ date: string; value: number }>;
    days: number[];
    dates: string[];
    killed: number[];
    wcKilled: number[];
    pathData: string;
    latest: Record<string, number | string>;
  } = (await response.json()).reduce(
    (acc: any, d: any, day: number) => ({
      ...acc,
      latest: {
        lastReportDate: d.report_date,
        gazaKilled: d.ext_killed_cum,
        gazaInjured: d.ext_injured_cum,
        gazaChildren: d.ext_killed_children_cum,
        gazaWomen: d.ext_killed_women_cum,
      },
      svgViewbox: {
        width,
        height,
      },
      days: acc.days.concat(day + 1),
      dates: acc.dates.concat(d.report_date),
      killed: acc.killed.concat(d.ext_killed_cum),
      wcKilled: acc.wcKilled.concat(
        d.ext_killed_children_cum + d.ext_killed_women_cum
      ),
      chart: acc.chart.concat({
        date: d3.timeParse("%Y-%m-%d")(d.report_date),
        value: d.ext_killed_cum,
      }),
    }),
    {
      chart: [],
      days: [],
      dates: [],
      killed: [],
      wcKilled: [],
      latest: {},
    }
  );

  var x = d3
    .scaleTime()
    .domain(
      d3.extent(data.chart, function (d: any) {
        return d.date;
      })
    )
    .range([0, width]);

  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data.chart, function (d: any) {
        return +d.value;
      }),
    ])
    .range([height, 0]);

  const pathData = d3
    .area()
    .x(function (d: any) {
      return x(d.date);
    })
    .y0(y(0))
    .y1(function (d: any) {
      return y(d.value);
    });

  svg
    .append("path")
    .datum(data.chart)
    .attr("id", "chartpath")
    .attr("fill", "rgba(100,40,40,1)")
    .attr("stroke", "rgba(168, 44, 44, 1)")
    .attr("stroke-width", 2)
    .attr("clip-path", "url(#curtain)")
    .attr("mask", "url(#curtainfade)")
    .attr("d", pathData);

  data.pathData = svg.select("path").attr("d");

  const svgStr = d3n.svgString();
  const [, pathStartPart] = svgStr.split("><path");
  const [pathAttributes] = pathStartPart.split("></path>");
  const astroDoc = `---
---

<path${pathAttributes}></path>
`;

  cp.execSync("mkdir -p site/src/generated");
  fs.writeFileSync("site/src/generated/killed.astro", astroDoc);

  const dataWithoutChart: typeof data | Partial<Pick<typeof data, "chart">> =
    data;
  delete dataWithoutChart.chart;
  fs.writeFileSync(
    "site/src/generated/data.json",
    JSON.stringify(dataWithoutChart)
  );
};

render();
