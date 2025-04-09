import { readFile } from "fs";
import { Raptor } from "../../dist/index.js";
import Readline from "readline";
import { EventEmitter } from "events";

const raptorEvent = new EventEmitter();

readFile("./hello-world.rap", (err, data) => {
  if (err) throw err;
  const raptor = new Raptor(data);
  raptor.parse();
  raptor.onOutput = (output) => {
    console.log(output);
    raptor.startExecution();
    raptorEvent.emit("execute");
  };

  raptor.onInput = (prompt) => {
    const readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question(prompt, (answer) => {
      raptor.setInputAnswer(answer);
      raptor.startExecution();
      raptorEvent.emit("execute");
      readline.close();
    });
  };

  // interpret the program

  raptorEvent.on("execute", () => {
    while (raptor.step());
  });

  raptorEvent.emit("execute");
});
