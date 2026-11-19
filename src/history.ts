import type { AddLineCommand } from "./add-line-command.ts";

// Command history: orders undo/redo; each command acts as a Caretaker.
export class History {
  #undoStack: AddLineCommand[] = [];
  #redoStack: AddLineCommand[] = [];

  execute(command: AddLineCommand): void {
    command.execute();
    this.#undoStack.push(command);
    // A new edit discards available redo steps.
    this.#redoStack.length = 0;
  }

  undo(): void {
    const previous = this.#undoStack.pop();
    if (!previous) {
      return;
    }

    previous.undo();
    this.#redoStack.push(previous);
  }

  redo(): void {
    const next = this.#redoStack.pop();
    if (!next) return;

    next.redo();
    this.#undoStack.push(next);
  }
}
