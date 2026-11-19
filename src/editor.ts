import assert from "node:assert";
import type { Interface } from "node:readline";

/** Adding a symbol to the interface makes it easier to implement. */
const mementoBrand: unique symbol = Symbol("Memento");

/** Memento is a narrow interface. No internal state exposed. */
export interface Memento {
  readonly [mementoBrand]: true;
}

/** TextMemento class stores the state of the Originator - wide interface */
class TextMemento implements Memento {
  readonly [mementoBrand] = true;

  #state: string;

  public get state(): string {
    return this.#state;
  }

  public constructor(state: string) {
    this.#state = state;
  }
}

const instructions =
  "Type into the editor. Ctrl+Z undoes a line. Ctrl+Y redoes it.";

/** Originator class owns the current text and creates snapshots of its state. */
export class Editor {
  #text: string = "";
  #readline: Interface;

  public get text(): string {
    return this.#text;
  }

  public constructor(readline: Interface) {
    this.#readline = readline;
  }

  public update(line: string): void {
    this.#text += `${line}\n`;
  }

  public snapshot(): Memento {
    return new TextMemento(this.text);
  }

  public restore(memento: Memento): void {
    assert.ok(memento instanceof TextMemento, "Invalid editor memento");
    this.#text = memento.state;
  }

  /** Not related to the pattern. */
  public render(): void {
    console.clear();
    console.log(instructions);
    process.stdout.write(this.#text);
    this.#readline.prompt(true); // to keep existing input
  }
}
