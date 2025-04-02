import { Parser } from "./parser";
import { readFromFile } from "./utils";

(async () => {
  const data = await readFromFile("./examples/example2.rap");
  const parser = new Parser(data);
  const records = parser.run();
  console.log(records);
})();
