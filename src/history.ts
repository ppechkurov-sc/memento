import type { Memento } from "./editor.ts";

export class History {
  #mementos: Memento[] = [];

  keep(memento: Memento): void {
    this.#mementos.push(memento);
  }

  takeLatest(): Memento | undefined {
    return this.#mementos.pop();
  }
}
