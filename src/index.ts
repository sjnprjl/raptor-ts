import { Parser } from "./parser";
import { readFromFile } from "./utils";

(async () => {
  const data = await readFromFile("./examples/examples1.rap");
  const parser = new Parser(data);
  parser.run();
})();
