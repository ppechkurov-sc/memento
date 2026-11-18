import { createInterface } from "node:readline";
import { Editor } from "./editor.ts";
import { History } from "./history.ts";

console.clear();
const instructions =
  "Type into the editor. Ctrl+Z undoes a line. Ctrl+Y redoes it. Ctrl+D on an empty line exits.";
console.log(instructions);

const editor = new Editor();
const history = new History();

const stdin = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "", // disable default propmt
});
// Handle CTRL+Z to undo
stdin.on("SIGTSTP", () => {
  const memento = editor.save();
  history.undo(memento);
  render();
});

// Handle CTRL+Y to redo
process.stdin.on("keypress", (_character, key) => {
  if (key.ctrl && key.name === "y") {
    const memento = editor.save();
    history.redo(memento);
    render();
  }
});

function render(): void {
  console.clear();
  console.log(instructions);
  process.stdout.write(editor.text);
}

for await (const line of stdin) {
  const memento = editor.save();
  history.save(memento);
  editor.text = `${editor.text + line}\n`;
}

stdin.close();
