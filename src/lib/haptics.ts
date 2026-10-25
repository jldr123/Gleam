/** A light tap where the phone supports it (Android). Safari has no vibration API, so it does nothing there. */
export function tapHaptic(): void {
  try {
    navigator.vibrate?.(8)
  } catch {
    // Some browsers throw if vibration is blocked; a missing buzz is fine.
  }
}
