// Memento class that stores the state of the Originator
class Memento {
  #state: string;

  constructor(state: string) {
    this.#state = state;
  }

  public get state(): string {
    return this.#state;
  }
}

const instructions =
  "Type into the editor. Ctrl+Z undoes a line. Ctrl+Y redoes it.";

// Originator class owns the current text and creates snapshots of its state.
export class Editor {
  #text: string = "";

  public get text(): string {
    return this.#text;
  }

  public update(line: string): void {
    this.#text += `${line}\n`;
  }

  public snapshot(): Memento {
    return new Memento(this.text);
  }

  public restore(memento: Memento): void {
    this.#text = memento.state;
  }

  public render(): void {
    console.clear();
    console.log(instructions);
    process.stdout.write(this.#text);
  }
}

// Caretaker class captures snapshots around an edit and restores them for undo/redo.
export class History {
  #undoStack: Memento[] = [];
  #redoStack: Memento[] = [];

  public save(memento: Memento): void {
    this.#undoStack.push(memento);
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
