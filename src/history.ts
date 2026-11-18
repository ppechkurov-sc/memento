import type { Memento } from "./editor.ts";

// Caretaker: manages undo/redo snapshots without reading their saved state.
export class History {
  #undoStack: Memento[] = [];
  #redoStack: Memento[] = [];

  save(snapshot: Memento): void {
    this.#undoStack.push(snapshot);
    // A new edit discards available redo steps.
    this.#redoStack.length = 0;
  }

  undo(current: Memento): void {
    const previous = this.#undoStack.pop();
    if (!previous) {
      return;
    }

    this.#redoStack.push(current);
    previous.restore();
  }

  redo(current: Memento): void {
    const next = this.#redoStack.pop();
    if (!next) return;

    this.#undoStack.push(current);
    next.restore();
  }
}
