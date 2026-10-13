/**
 * Copies the atoms with an index in `[start, end)`, and drops each group that has no atom left.
 *
 * @remarks
 * A table keeps its header row, so every page that holds part of a table repeats the column names.
 */
function slice(flow: HTMLElement, start: number, end: number) {
  const copy = flow.cloneNode(true) as HTMLElement;
  copy.removeAttribute("data-flow");
  for (const atom of copy.querySelectorAll<HTMLElement>("[data-atom]")) {
    const index = Number(atom.dataset.atom);
    if (index < start || index >= end) atom.remove();
  }
  for (const group of [...copy.querySelectorAll("[data-group]")].reverse()) {
    if (!group.querySelector("[data-atom]")) group.remove();
  }
  for (const element of copy.querySelectorAll("[id]")) element.removeAttribute("id");
  return copy;
}

/**
 * Fills `target` with page boxes cut from the flow in `source`, each with its own copy of the page footer.
 *
 * @remarks
 * An atom (a marker row, a list item, a heading) never splits: a page takes whole atoms while its box stays at the
 * empty box height, and an atom marked `data-keep-next` moves to the next page with the atom after it.
 */
export function paginate(source: HTMLElement, target: HTMLElement) {
  const flow = source.querySelector<HTMLElement>("[data-flow]");
  const template = source.querySelector<HTMLElement>("[data-page]");
  if (!flow || !template) return;
  const atoms = [...flow.querySelectorAll<HTMLElement>("[data-atom]")];
  atoms.forEach((atom, index) => (atom.dataset.atom = String(index)));
  const limit = template.offsetHeight;
  const budget = limit - (template.querySelector("footer")?.offsetHeight ?? 0);
  const boxes = atoms.map((atom) => atom.getBoundingClientRect());

  target.replaceChildren();
  let start = 0;
  while (start < atoms.length) {
    const page = template.cloneNode(true) as HTMLElement;
    const body = page.querySelector("[data-page-body]");
    target.append(page);
    const fits = (end: number) => {
      body?.replaceChildren(slice(flow, start, end));
      return page.offsetHeight <= limit;
    };
    let end = start + 1;
    while (end < atoms.length && boxes[end]!.bottom - boxes[start]!.top <= budget) end++;
    while (end > start + 1 && !fits(end)) end--;
    while (end < atoms.length && fits(end + 1)) end++;
    while (end > start + 1 && atoms[end - 1]!.hasAttribute("data-keep-next")) end--;
    fits(end);
    start = end;
  }
}
