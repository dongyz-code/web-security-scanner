import { mergeAPIByDir } from "@m170/fastify";
import { join } from "node:path";
import { getDirname } from "@m170/utils/node";

const __dirname = getDirname(import.meta.url);

mergeAPIByDir({
  dir: join(__dirname, "../routes"),
  target: join(__dirname, "index.ts"),
})
  .then(() => {
    process.exit();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
