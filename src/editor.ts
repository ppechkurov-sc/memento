export interface Memento {
  restore(): void;
}

// Originator: owns the current text and creates snapshots of its state.
export class Editor {
  text = "";

  save(): Memento {
    return new Snapshot(this, this.text);
  }
}

// Memento: privately holds saved text and restores the editor that created it.
class Snapshot implements Memento {
  readonly #editor: Editor;
  readonly #text: string;

  constructor(editor: Editor, text: string) {
    this.#editor = editor;
    this.#text = text;
  }

  restore(): void {
    this.#editor.text = this.#text;
  }
}
