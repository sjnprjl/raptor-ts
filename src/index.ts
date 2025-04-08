import { Parser } from "./parser";
import { globalEnv } from "./raptor/constant";
import { Raptor } from "./raptor/raptor";
import { readFromFile } from "./utils";

(async () => {
  const fileName = process.argv[2];
  const data = await readFromFile(fileName);
  const parser = new Parser(data);
  const tokens = parser.run();
  const raptor = new Raptor(tokens, globalEnv);
  raptor.parse();
  raptor.interpret();
})();
