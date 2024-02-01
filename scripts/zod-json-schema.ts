import fs from "fs";
// @ts-expect-error bun types not up to date on alpha api (?)
import { $ } from "bun";
import { zodToJsonSchema } from "zod-to-json-schema";

const zodFiles = await $`ls site/src/schemas`;
const modules = zodFiles.stdout
  .toString()
  .split("\n")
  .map((line: string) => line.trim());

modules.forEach((fileName: string) => {
  if (fileName && fileName.endsWith(".ts")) {
    const { schema, name } = require(`../site/src/schemas/${fileName}`);
    const jsonSchema = zodToJsonSchema(schema, name);
    fs.writeFileSync(
      `site/src/schemas/${name}.json`,
      JSON.stringify(jsonSchema, null, 2)
    );
  }
});
