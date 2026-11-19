import { createInterface } from "node:readline";
import { Editor, History } from "./editor.ts";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "", // Disable the default prompt.
});

const editor = new Editor();
const history = new History();

// Handle CTRL+Z to undo
readline.on("SIGTSTP", () => {
  const current = editor.snapshot();
  const meme = history.undo(current);
  if (!meme) {
    return;
  }

  editor.restore(meme);
  editor.render();
});

// Handle CTRL+Y to redo
process.stdin.on("keypress", (_character, key) => {
  if (key.ctrl && key.name === "y") {
    const current = editor.snapshot();
    const meme = history.redo(current);
    if (!meme) {
      return;
    }

    editor.restore(meme);
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
