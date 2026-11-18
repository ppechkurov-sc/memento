const mementoBrand: unique symbol = Symbol("Memento");

export interface Memento {
  readonly [mementoBrand]: true;
}

export class Editor {
  #text = "";
  #savedText = new WeakMap<Memento, string>();

  get text(): string {
    return this.#text;
  }

  setText(text: string): void {
    this.#text = text;
  }

  save(): Memento {
    const memento: Memento = Object.freeze({ [mementoBrand]: true as const });
    this.#savedText.set(memento, this.#text);
    return memento;
  }

  restore(memento: Memento): void {
    const savedText = this.#savedText.get(memento);
    if (savedText === undefined) {
      throw new Error("This memento was not created by this editor.");
    }
    this.#text = savedText;
  }
}
