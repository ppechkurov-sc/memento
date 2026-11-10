MEMENTO
===============

<!-- alignment: center -->

**Undo/redo without breaking encapsulation**

Behavioral design pattern from the Gang of Four

![image:width:45%](meme.jpg)

Node.js + TypeScript • ~15-minute engineering talk

<!--
speaker_note: |
  Imagine a user editing a draft or an internal configuration form. They
  change their mind and press Undo. How can the application return to an
  earlier state without exposing all of the object's implementation details?
  Today we'll use this familiar problem to understand the Memento pattern
  as described by the Gang of Four and implement it in TypeScript.
-->

<!-- end_slide -->

What does Ctrl+Z actually need?
===============================

```text
Version 1      Hello
      |
      v
Version 2      Hello, world!
      |
      v
Version 3      Hello, world! This is a draft.
```

<!-- pause -->

**Undo** from version 3 → version 2  
**Redo** from version 2 → version 3

The question: *Who saves the old state, and who is allowed to read it?*

<!--
speaker_note: |
  Ask the audience how they would implement this in a text editor, multi-step
  form, or an admin panel. The user doesn't care which methods produced the
  text; they care that the previous state can be restored. We need a place
  to keep past versions. The next question is whether that place should be
  allowed to know the internals of the editor.
-->

<!-- end_slide -->

Three tempting shortcuts
========================

- Store references to the mutable editor → **not a snapshot**.
- Let `History` copy all public fields → **leaks implementation details**.
- Reverse every edit individually → **more operation-specific logic**.

<!-- pause -->

**Can we restore an object's state without exposing that state to the history manager?**

<!--
speaker_note: |
  Pushing the same mutable object into an array does not preserve earlier
  versions: all entries refer to the same object. Copying its fields makes
  the history implementation depend on its internal representation. And
  reversing operations can work, but it is a different design: it requires
  knowing how each operation can be undone. Memento solves the snapshot
  problem while protecting encapsulation.
-->

<!-- end_slide -->

The GoF definition
==================

> Without violating encapsulation, capture and externalize an object's
> internal state so that the object can be restored to this state later.

*Gamma, Helm, Johnson & Vlissides — Design Patterns (1994), Memento*

**Category:** Behavioral pattern

**Two requirements:**

1. Capture enough state to restore the object later.
2. Do it **without breaking encapsulation**.

<!--
speaker_note: |
  This is the original intent of Memento in the Gang of Four book, not just
  a generic snapshot technique. Notice the wording: without violating
  encapsulation. If our History class directly reads the editor's private
  data structure, the implementation may support Undo but it has missed
  a central goal of the pattern. Memento is a behavioral design pattern.
-->

<!-- end_slide -->

The cast: three participants
============================

```text
 [Editor / Originator] -- save() --> [Memento]
          ^                           ^
          |                           |
          | restore(memento)          | stores opaque tokens
          |                           |
       [History / Caretaker] ----------+
```

- **Originator:** owns state; knows how to save and restore it.
- **Memento:** holds a snapshot; hides its representation.
- **Caretaker:** decides *when* to save/restore; stores tokens only.

<!--
speaker_note: |
  Here the Originator is an Editor. It is the only component that knows
  how its private text state should be captured and restored. A Memento
  represents a saved state. The Caretaker, called History here, controls
  the timeline. It may push and pop mementos, but cannot inspect the
  saved text. This arrangement is the core GoF collaboration.
-->

<!-- end_slide -->

The collaboration
=================

```text
1. History:  checkpoint(editor)
2. Editor:   save() -> memento
3. History:  push memento onto undo stack
4. User:     changes the editor
5. History:  undo(editor)
6. Editor:   restore(previous memento)
```

<!-- pause -->

**Important:** take a checkpoint **before** the edit.

<!--
speaker_note: |
  Walk through the calls rather than the code. Before a user-visible change,
  History asks Editor to save its current state. History keeps the returned
  token and lets the edit happen. For Undo it passes an earlier token back
  to Editor, which restores itself. This example captures before the edit;
  other UIs can choose different checkpoint boundaries, such as per command
  or after a user stops typing. The pattern does not prescribe the granularity.
-->

<!-- end_slide -->

The subtle point: encapsulation
===============================

**This is a snapshot, but not a strong GoF Memento:**

```typescript
// Illustrative anti-example, not our implementation
export type Snapshot = Readonly<{ text: string }>;
declare const snapshot: Snapshot;

// The caretaker can read implementation details:
console.log(snapshot.text);
```

`Readonly` prevents ordinary TypeScript assignments; it does **not** make the data unreadable, deeply immutable, or runtime-private.

**Goal:** the caretaker holds a token, not a readable data structure.

<!--
speaker_note: |
  This is why our first simplified example was educational but not fully
  GoF-faithful. A TypeScript Readonly type restricts writing through that
  reference, but it still exposes the field to any caller. It also doesn't
  enforce deep immutability at runtime. GoF talks about a wide interface
  that the Originator can use, and a narrow interface for the Caretaker.
  We can model that distinction with module boundaries and an opaque type.
-->

<!-- end_slide -->

TypeScript: make the memento opaque
===================================

`src/editor.ts`

```typescript
const savedText = new WeakMap<EditorSnapshot, string>();

class EditorSnapshot {
  #brand = true;
  constructor(text: string) {
    savedText.set(this, text);
    Object.freeze(this);
  }
}

export type EditorMemento = EditorSnapshot;
```

**Not exported:** `EditorSnapshot` constructor and `savedText` map.

<!--
speaker_note: |
  The concrete snapshot class and WeakMap live inside editor.ts. Other
  modules can import the exported EditorMemento type, but that is only a
  TypeScript type, not a public constructor. The private brand makes the
  type non-structural, so ordinary callers cannot fake one with an object
  literal. The saved text is in a module-private WeakMap, not in a publicly
  readable snapshot property. JavaScript still requires runtime checks,
  because TypeScript types are erased.
-->

<!-- end_slide -->

Originator: Editor
==================

`src/editor.ts` (continuation)

```typescript
export class Editor {
  #text = "";
  get text(): string { return this.#text; }
  append(value: string): void { this.#text += value; }

  save(): EditorMemento {
    return new EditorSnapshot(this.#text);
  }
  restore(memento: EditorMemento): void {
    const text = savedText.get(memento);
    if (text === undefined) throw new Error("Unknown snapshot");
    this.#text = text;
  }
}
```

Only the editor knows what a snapshot **means**.

<!--
speaker_note: |
  The Editor controls both operations. Saving copies its current string
  into an opaque object. Restoring retrieves the value from the private
  WeakMap. A fake or foreign snapshot causes an error. Here our state is
  just a string, which is an immutable JavaScript primitive. If the state
  contained arrays, Maps, Dates, or nested mutable objects, we would need
  a deliberately designed copy or immutable state strategy; a shallow
  reference would not preserve a historical version.
-->

<!-- end_slide -->

Caretaker: History
==================

`src/history.ts`

```typescript
export class History {
  #undo: EditorMemento[] = [];
  #redo: EditorMemento[] = [];

  checkpoint(editor: Editor): void {
    this.#undo.push(editor.save());
    this.#redo = [];
  }
  // undo(...) and redo(...) come next
}
```

`History` knows **when** to store snapshots.  
It does **not** know whether a snapshot contains text, a form, or a graph.

<!--
speaker_note: |
  Notice what is deliberately missing. History never accesses text or any
  other private editor field; it stores EditorMemento values. The editor
  can change its internal representation without forcing us to rewrite
  this caretaker. The checkpoint method also clears the redo stack,
  because taking a new edit after Undo starts a new branch of history.
  The fuller implementation is in the runnable TypeScript project.
-->

<!-- end_slide -->

Undo and redo
=============

`src/history.ts` (continuation)

```typescript
undo(editor: Editor): boolean {
  const previous = this.#undo.pop();
  if (!previous) return false;
  this.#redo.push(editor.save());
  editor.restore(previous);
  return true;
}
redo(editor: Editor): boolean {
  const next = this.#redo.pop();
  if (!next) return false;
  this.#undo.push(editor.save());
  editor.restore(next);
  return true;
}
```

**Save the current state before restoring the other one.**

<!--
speaker_note: |
  For Undo, first remove a previous snapshot from the undo stack. Before
  restoring it, save the current editor state on the redo stack. That lets
  the user move forward again. Redo is symmetric: save the current state
  to undo, and restore the next redo token. On empty stacks the methods
  return false. There is no access to savedText in the History code.
-->

<!-- end_slide -->

One edit creates a new timeline
===============================

```text
         Hello  -->  Hello, world!
                        |
                       Undo
                        v
                      Hello
                        |
              NEW EDIT: ", TypeScript!"
                        v
                 Hello, TypeScript!
```

**Redo is now invalid.** We branched away from the old future.

<!--
speaker_note: |
  This catches a common bug. Suppose the user typed Hello, world!, pressed
  Undo, and then typed something different. The old redo entry cannot be
  reused, or Redo would unexpectedly replace the new edit. That's why
  checkpoint clears the redo stack. Be ready to emphasize that the
  Memento pattern itself is about snapshots and encapsulation; how we
  arrange undo and redo stacks is a caretaker policy built on top of it.
-->

<!-- end_slide -->

Let's run it
============

From the accompanying example project:

```bash
npm install
npm start
```

Expected output:

```text
After editing: Hello, world!
After undo:    Hello
After redo:    Hello, world!
New branch:    Hello, TypeScript!
Can redo?      false
```

Tests: `npm test` (includes opaque-snapshot and branch checks).

<!--
speaker_note: |
  Switch to the terminal with the project directory and run npm start.
  Highlight the visible sequence: two edits, Undo, Redo, Undo again, then a
  new branch. The final false result confirms that the redo history was
  discarded. If there is no live terminal available, read the output on
  this slide. The project includes a test that confirms saved text is not
  exposed as a public property on the memento.
-->

<!-- end_slide -->

When Memento helps — and what it costs
======================================

<!-- column_layout: [1, 1] -->
<!-- column: 0 -->

**Good fits**

- Editor undo/redo
- Draft or form checkpoints
- Local configuration rollback
- Temporary workflow states

<!-- column: 1 -->

**Trade-offs**

- Memory scales with snapshot size
- Mutable graphs require safe copying
- History needs retention limits
- Old snapshots may need versioning

<!-- reset_layout -->

**Choose checkpoint boundaries deliberately.**

<!--
speaker_note: |
  It is a good fit when users should be able to restore an earlier state
  of an in-memory object. But there is no free lunch: every snapshot
  consumes resources, and saving after every keystroke may be wasteful.
  Cap the history depth, batch related edits, and think about structural
  sharing if the state is large. If snapshots are persisted, serialization
  and schema evolution become additional concerns.
-->

<!-- end_slide -->

Node.js production caveats
==========================

- **Scope:** one history per document, request workflow, or user session.
- **Memory:** use limits; don't keep unbounded snapshots in a server process.
- **Persistence:** in-memory snapshots vanish when the process restarts.
- **Security:** snapshots can retain sensitive data longer than intended.
- **Effects:** restoring state does **not** undo an email or database write.

<!--
speaker_note: |
  These caveats matter more in a backend than in a toy editor. A global
  singleton history would mix users or documents. If a process crashes,
  in-memory snapshots disappear. If you need durable history, consider
  storing versioned snapshots in an appropriate persistence layer, while
  enforcing access controls and retention limits. Most importantly,
  restoring an object does not reverse external side effects. For those,
  use transactions, explicit compensating actions, or another design.
-->

<!-- end_slide -->

Memento vs Command vs Event Sourcing
====================================
<!-- alignment: center -->

| Approach | Primary thing saved | Typical purpose |
|---|---|---|
| **Memento** | Object state | Restore a previous version |
| **Command** | An operation | Execute, queue, or undo actions |
| **Event Sourcing** | Domain events | Rebuild/audit domain history |

They can be **combined**, but they are not interchangeable.

<!--
speaker_note: |
  A Command encapsulates an action such as AddText or ChangeAddress. An
  undoable command might store an inverse operation or even a memento.
  Event Sourcing records domain facts such as AddressChanged and rebuilds
  state by replay; that has different consistency and persistence concerns.
  Memento is narrower: it answers how to save and restore a particular
  object's state while preserving encapsulation.
-->

<!-- end_slide -->

Three things to remember
========================

1. **GoF Memento is not merely a copy:** encapsulation matters.
2. **Editor saves/restores; History manages timing and storage.**
3. **Undoing in-memory state ≠ reversing external side effects.**

<!-- pause -->

**Discussion:** Would you snapshot an entire shopping cart, or just a field?

*Reference: Gamma et al., Design Patterns (1994), Memento.*

<!--
speaker_note: |
  Wrap up with the three principles. The GoF pattern is about maintaining
  a boundary around an object's internal representation, while enabling
  later restoration. The caretaking policy can be changed without changing
  the object. Finally, when applying this in our Node.js services we have
  to distinguish in-memory state changes from effects outside the process.
  Ask the final question to invite discussion about snapshot granularity,
  storage costs, and consistency.
-->
