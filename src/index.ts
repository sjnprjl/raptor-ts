import { Parser } from "./parser";
import { Raptor } from "./raptor/raptor";
import { LOG, readFromFile } from "./utils";

(async () => {
  const data = await readFromFile("./examples/example2.rap");
  const parser = new Parser(data);
  const tokens = await parser.run();
  const raptor = new Raptor(tokens);
  raptor.parse();
  LOG(raptor);
  // interpret raptor
  raptor.interpret();
})();
