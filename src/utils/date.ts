// The one "what day is it" helper. Streak logic, daily-save validity, and the
// share card all compare these strings — they must come from the same
// computation everywhere (this was previously defined in four places, which
// is how a timezone fix would have landed in only some of them).
export function todayISO(): string {
    return new Date().toISOString().slice(0, 10)
}
