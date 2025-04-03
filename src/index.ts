import { Parser } from "./parser";
import { Raptor } from "./raptor/raptor";
import { LOG, readFromFile } from "./utils";

(async () => {
  const data = await readFromFile("./examples/example1.rap");
  const parser = new Parser(data);
  const tokens = parser.run();
  const raptor = new Raptor(tokens);
  // raptor.parse();
  // LOG(raptor);
})();
