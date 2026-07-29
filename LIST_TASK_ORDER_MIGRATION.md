# List/Task Order Migration — What the Kotlin App Needs to Do

**For:** a Claude Code session working in the `reminders-tool` repo (the native
Kotlin/Compose Light Phone III app, `native-rewrite` branch per
`PHONE_SYNC_STATUS.md` in `reminders-web`). This doc is self-contained — you
shouldn't need anything else from `reminders-web` to act on it, though
`src/lib/models.ts`, `src/lib/store.ts`, and `src/lib/ordering.ts` in that repo
are the source of truth if you want to double-check anything here.

**Why this exists:** `reminders-web`'s drag-and-drop reordering for lists and
tasks used to write one Firestore document per item on every reorder (e.g.
dragging one task in a 30-task list wrote all 30 task documents). That's cheap
per-operation but adds up fast against Firestore's free-tier daily read/write
quota if this project ever moves from "one Firebase project per user" to a
single shared project. It's been changed to write exactly one document per
reorder, mirroring how subtask order already worked (subtasks are stored as one
array field on their parent task document, so reordering them was always a
single write — this same pattern is now used for lists and tasks). This is a
Firestore schema change and the phone reads/writes this same schema directly
over REST, so it needs a matching update or its reordering (today or whenever
it's built) will silently stop taking effect once the web side has touched a
given list's or list-of-tasks' order.

## Schema changes

Two new **optional** fields, additive only — no existing documents need to be
migrated, and nothing is removed.

1. **`users/{uid}/settings/singleton`** gains `listOrder: string[]` — an
   ordered array of list ids. This is the equivalent of a `listOrder` field on
   whatever Kotlin data class mirrors `Settings` in `models.ts`.
2. **`users/{uid}/lists/{listId}`** gains `taskOrder: string[]` — an ordered
   array of *active* (non-completed) task ids belonging to that list. This is
   the equivalent of a `taskOrder` field on whatever Kotlin data class mirrors
   `ReminderList` in `models.ts`. Completed tasks are unaffected — they're
   sorted by `completedAt` descending, not by manual order, on both clients.

The existing numeric `order` field on both `Task` and `ReminderList` documents
is **not removed and still written on creation** — it's now only a fallback
sort key, not the field that gets rewritten on every drag reorder.

## Sort semantics (implement this exact fallback rule)

For lists: if `settings.listOrder` is present and non-empty, sort lists by
their position in that array; any list whose id isn't in the array gets
appended after, sorted by its own `order` field ascending. If `listOrder` is
absent/empty, sort entirely by `order` (today's behavior, unchanged).

For tasks within a list: same rule, using that list's own `taskOrder` field
instead of `settings.listOrder`.

`reminders-web`'s implementation of this is `applyOrder()` in
`src/lib/ordering.ts` — a generic "sort by id-array, fall back to a comparator
for anything not in it" helper used for both lists and tasks. Worth mirroring
the exact same fallback logic in Kotlin so the two clients never disagree on
order given the same data.

## What to implement on the phone

1. **Data classes:** add `listOrder: List<String>? = null` to the
   Settings-equivalent model, and `taskOrder: List<String>? = null` to the
   ReminderList-equivalent model.
2. **Reading/display order:** wherever the phone currently sorts lists or a
   list's tasks by the numeric `order` field, apply the fallback rule above
   instead.
3. **If/when the phone gets its own drag-reorder for lists or tasks**, it must
   write to these same fields as a single whole-array write — `listOrder` on
   the settings singleton, `taskOrder` on the relevant list document — not by
   rewriting each item's own `order` field. If it keeps writing the old
   per-item `order` field only, those reorders will have no visible effect on
   the web app once that list/list-of-tasks has a `listOrder`/`taskOrder`
   entry, because the web read path prefers the array over per-doc `order`.
4. **No `firestore.rules` changes needed** — the existing
   `request.auth.uid == uid` rule is scoped at the document level and already
   covers writes to these new fields.
5. **Rollout is safe with no coordination required for existing data:** until
   the phone is updated, everything phone-side keeps working exactly as
   before. Lists/tasks it creates or touches just won't be reflected in
   `listOrder`/`taskOrder` until the *web* client performs its next drag
   reorder for that collection (which fully repopulates the array from
   whatever's currently visible there).

## One merge-engine subtlety worth knowing about

Per `PHONE_SYNC_STATUS.md`, the phone's merge engine is **whole-document
last-write-wins** — it doesn't merge individual fields, it takes the entire
winning document snapshot and discards the other. Before this change, task
reordering only ever touched *task* documents, and list metadata edits (rename,
delete) only ever touched *list* documents — they couldn't conflict with each
other because they were different documents.

After this change, a task reorder is a write to the **list** document (via
`taskOrder`). That means a task reorder on web and a list rename on the phone,
if both happen before either side has synced, can now race on the same
document in a way they never could before — whichever `updatedAt` is later
wins the whole document, silently discarding the other change. This isn't a
new *class* of problem (the existing whole-doc-LWW design already accepts this
tradeoff generally, per the "deliberate, simplest-viable choice" note in
`PHONE_SYNC_STATUS.md`), but it's a new *pair* of operations that can hit it,
worth being aware of rather than assuming task-reorder and list-rename are
still independent.

## Not affected

- **Backup import/export** (`utils/backup.ts` on phone, `parseBackupFile`/
  `importBackup` in `reminders-web`'s `store.ts`) is unchanged. `listOrder` and
  `taskOrder` aren't part of that format — restoring a backup already doesn't
  restore settings, and restored lists/tasks fall back to their own `order`
  field like any other list/task not yet captured by the new arrays.
- **Auth, subtask ordering, deletes/tombstones** — none of this touches those.
