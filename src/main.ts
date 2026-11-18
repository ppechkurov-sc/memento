import { createInterface } from "node:readline";
import { Editor } from "./editor.ts";
import { History } from "./history.ts";

const editor = new Editor();
const history = new History();
let redoHistory = new History();

console.clear();
const instructions =
  "Type into the editor. Ctrl+Z undoes a line. Ctrl+Y redoes it. Ctrl+D on an empty line exits.";
console.log(instructions);

const input = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "",
});

input.on("SIGTSTP", () => {
  restoreFrom(history, redoHistory);
});

process.stdin.on("keypress", (_character, key) => {
  if (key.ctrl && key.name === "y") {
    restoreFrom(redoHistory, history);
  }
});

function restoreFrom(source: History, destination: History): void {
  const previous = source.takeLatest();
  if (!previous) {
    return;
  }

  destination.keep(editor.save());
  editor.restore(previous);
  console.clear();
  console.log(instructions);
  process.stdout.write(editor.text);
  input.prompt(true);
}

for await (const line of input) {
  const snapshot = editor.save();
  history.keep(snapshot);

  redoHistory = new History();
  editor.setText(`${editor.text + line}\n`);
}

input.close();
