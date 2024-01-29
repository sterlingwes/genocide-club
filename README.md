# genocide-club

A time-based way to visualize the statements of pro-Israel people and groups, by superimposing their statements on a graph showing the cumulative toll of Israel's actions in Gaza since October 7.

Our goal is to put these statements in the necessary context.

## Running Locally

### Prerequisites

You'll need [bun](https://bun.sh) installed. Then run the following in the root of the repo:

- `bun install`
- `bun data`

The `bun data` command will pull the latest daily casualty time series from data.techforpalestine.org, build the SVG graph with that data and store a subset of that data in `site/src/generated`.

### Development

`bun run dev` will run the development server.

`bun run build` then `bun run preview` will run a simulation of the deployed site, not in dev mode.

`bun run test` will run any unit tests or snapshots.

## Contributing

### Adding or Updating a Person or Group

See the JSON files under `site/src/content/enabler` for an example of the format that gets used to render each visualization page.

### Changing the Site

This site is powered by [Astro](https://astro.build). It's a static website, there's no server runtime.

Note the following guiding principles: the core animation (graph reveal, post appearance, label counting-up) should work without client-side javascript (build the animation sequencing on "the server" at build time).

Where to find / place things:

- `site/src/pages/[...slug].astro` is the main template used to generate the visualization pages
- `site/src/lib/timeline` is the core animation sequencing logic, run at build time and not included as client-side JS
- `site/src/lib/browser` has any javascript we run in the browser or referenced in a script tag in the page template
