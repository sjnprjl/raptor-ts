import { Parser } from "./parser";
import { globalEnv } from "./raptor/environment";
import { Raptor } from "./raptor/raptor";
import { readFromFile } from "./utils";

(async () => {
  const data = await readFromFile("./examples/factorial.rap");
  const parser = new Parser(data);
  const tokens = parser.run();
  const raptor = new Raptor(tokens, globalEnv);
  raptor.parse();
  raptor.interpret();
})();
