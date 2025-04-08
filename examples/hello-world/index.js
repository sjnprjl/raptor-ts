import { readFile } from "fs";
import { Raptor } from "../../dist/index.js";

readFile("./examples/hello-world/hello-world.rap", (_, data) => {
  const raptor = new Raptor(data);
  raptor.parse();
  raptor.interpret();
});
