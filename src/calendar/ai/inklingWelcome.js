/**
 * Inkling welcome copy for settings / first-run (static; can wire to model later).
 * @param {string} displayName
 */
export function getInklingWelcomeMessage(displayName) {
  const who = displayName || "there";
  return (
    `Hi ${who} — welcome to Inkling.\n\n` +
    `The short version: turn what you're studying into practice. Pick a topic and you'll get ` +
    `graded flashcards with hints and step-by-step explanations, so it actually sticks.\n\n` +
    `It's also a calendar you can just talk to — tell me a plan in plain words ` +
    `("lunch with Sam Thursday at 1") and I'll add it and remind you, always checking before I save.\n\n` +
    `Tap 📇 Flashcards to start a deck, or just tell me what you're working on.`
  );
}
