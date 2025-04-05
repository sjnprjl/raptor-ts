import { Parser } from "./parser";
import { globalEnv } from "./raptor/environment";
import { Raptor } from "./raptor/raptor";
import { LOG, readFromFile } from "./utils";

(async () => {
  const data = await readFromFile("./examples/calc-area.rap");
  const parser = new Parser(data);
  const tokens = await parser.run();
  const raptor = new Raptor(tokens, globalEnv);
  raptor.parse();

  let run = true;
  while (run) {
    run = await raptor.step();
  }

  // interpret raptor
  // raptor.interpret();
})();
