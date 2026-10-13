export interface ScrollPane {
  scrollTop: number;
  getBoundingClientRect: () => { top: number };
  scrollTo: (options: ScrollToOptions) => void;
}
export interface RecipeTarget {
  getBoundingClientRect: () => { top: number };
  focus: (options: FocusOptions) => void;
}

export const revealRecipeInPane = (pane: ScrollPane | null, target: RecipeTarget | null): boolean => {
  if (!pane || !target) return false;
  const top = pane.scrollTop + target.getBoundingClientRect().top - pane.getBoundingClientRect().top;
  pane.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  target.focus({ preventScroll: true });
  return true;
};
