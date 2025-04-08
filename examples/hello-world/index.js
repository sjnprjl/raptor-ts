import { readFile } from "fs";
import { Raptor } from "../../dist/index.js";

readFile("./hello-world.rap", (err, data) => {
  if (err) throw err;
  const raptor = new Raptor(data);
  raptor.parse();
  raptor.interpret();
});
