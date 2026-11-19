import type { Memento } from "./editor.ts";

/** Caretaker class - captures snapshots. No access to internal state. */
export class History {
  #undoStack: Memento[] = [];
  #redoStack: Memento[] = [];

  public save(memento: Memento): void {
    this.#undoStack.push(memento);
    this.#redoStack.length = 0;
  }

  public undo(current: Memento): Memento | undefined {
    const previous = this.#undoStack.pop();
    if (!previous) {
      return;
    }

    this.#redoStack.push(current);
    return previous;
  }

  public redo(current: Memento): Memento | undefined {
    const next = this.#redoStack.pop();
    if (!next) {
      return;
    }

    this.#undoStack.push(current);
    return next;
  }
}
