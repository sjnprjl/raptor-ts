import { readFile } from "fs";
import { Raptor } from "../../dist/index.js";
import Readline from "readline";
import { EventEmitter } from "events";
import { nextTick } from "process";

const raptorEvent = new EventEmitter();

readFile("./hello-world.rap", (err, data) => {
  if (err) throw err;
  const raptor = new Raptor(data);
  raptor.parse();

  const resumeExecution = () => {
    raptor.startExecution();
    nextTick(() => {
      raptorEvent.emit("execute");
    });
  };

  raptor.onOutput = (output) => {
    console.log(output);
    resumeExecution();
  };

  raptor.onInput = (prompt) => {
    const readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question(prompt, (answer) => {
      raptor.setInputAnswer(answer);
      readline.close();
      resumeExecution();
    });
  };

  // interpret the program

  raptorEvent.on("execute", () => {
    while (raptor.step());
  });

  resumeExecution();
});
