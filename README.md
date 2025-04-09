# 🦖 raptor-ts

![TypeScript](https://img.shields.io/badge/Built%20With-TypeScript-3178c6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Node.js%20%7C%20Browser-brightgreen?logo=node.js)
![Status](https://img.shields.io/badge/Status-In%20Progress-orange)
![License](https://img.shields.io/badge/License-MIT-blue)
![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red)

**TypeScript-based Raptor file Deserializer and Interpreter**  
This is yet another one of my personal projects, which I promise to complete  
_(note: I have ditched several projects in the past for so many reasons)_.

---

## 📦 About This Library

This library _parses_ the binary `.rap` file created by [Raptor Software](https://raptor.martincarlisle.com/). The file is a **serialized** C# object.  
_How do I know this?_ I spent two days digging into it — and yes, I even got the source code of the project.

My goal is to make this library **platform-agnostic**, exposing just enough APIs to support both `Node.js` and the `Browser`.  
To make that possible, I've handed control over to the consumer — they manage input/output and even the interpreter event loop.  
There are definitely better ways to design this, but honestly, I’m satisfied with what I’ve achieved here.

---

## 💭 Why Build This?

> **TBH**, I really wanted to see if it was possible.  
> Also, I wanted to run `.rap` files in the browser (that project is under development).

Honestly, I’m proud I’ve made it this far.

## 🧠 Process

I’m dying to tell you how I reached this milestone.

### 🔍 Reading the Binary

Before I even wrote a line of code, I wanted to see what the binary looked like.  
So I spun up my favorite hex editor [ImHex](https://imhex.werwolv.net/) (you should really try this tool — it's genius) to inspect those `1s` and `0s`.

At first, it was overwhelming — just a wall of random hex values.  
But then I noticed many ASCII-readable characters like:  
`System.Int32`, `System.Boolean`, etc.

That’s when it hit me — this was C# source metadata.

So I went full-on rabbit hole mode:

- Googled a ton
- Asked ChatGPT a million times
- Pulled a few hairs 😅

I found nothing useful at first and nearly gave up, thinking this was impossible.

Then, finally, I stumbled upon C#’s `BinaryFormatter` — a (now deprecated) utility used to serialize C# objects into binary format.  
**Boom. That was my eureka moment.** Raptor was using this to serialize program state!

But of course, there’s no existing `BinaryFormatter` port for JavaScript. Nobody had written one yet.  
I was disappointed again… but this time, **motivated**. So I rolled up my sleeves and started building my own serializer/deserializer.

> Writing a C# object deserializer is **freaking hard** because it's so tightly coupled with the C# type system.  
> Luckily, I found the source code of `BinaryFormatter` and used it as a guide to create my JS port.

---

## 🧪 Demo


https://github.com/user-attachments/assets/7e0f72dc-c713-4ea7-8a06-32bdad46edb3



---

## 🛠️ Usage

Here’s a code snippet from my example:

```ts
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

  // Interpret the program
  raptorEvent.on("execute", () => {
    while (raptor.step());
  });

  raptorEvent.emit("execute");
});
```

# 🤝 Contributing

Feel free to fork, explore, or open issues and pull requests. If you know something about BinaryFormatter, I need your help 😅

# 📜 License

MIT © Sujan Parajuli
