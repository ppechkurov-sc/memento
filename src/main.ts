import { createInterface } from "node:readline";
import { Editor } from "./editor.ts";
import { History } from "./history.ts";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "", // Disable the default prompt.
});

const editor = new Editor(readline);
const history = new History();

// Handle CTRL+Z to undo
readline.on("SIGTSTP", () => {
  const current = editor.snapshot();
  const previous = history.undo(current);
  if (!previous) {
    return;
  }

  editor.restore(previous);
  editor.render();
});

// Handle CTRL+Y to redo
process.stdin.on("keypress", (_character, key) => {
  if (key.ctrl && key.name === "y") {
    const current = editor.snapshot();
    const next = history.redo(current);
    if (!next) {
      return;
    }

    editor.restore(next);
    editor.render();
  }
});

editor.render();

for await (const line of readline) {
  const meme = editor.snapshot();
  history.save(meme);

  editor.update(line);
  editor.render();
}

readline.close();
