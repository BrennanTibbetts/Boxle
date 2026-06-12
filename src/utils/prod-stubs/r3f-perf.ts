// Production stand-in for r3f-perf (vite resolve.alias, prod builds only).
// <Perf> only renders behind the leva `performance` toggle, which is fixed
// false in prod — the real package (~18KB gzipped) is unreachable dead weight.
export function Perf(_props: Record<string, unknown>): null {
    return null
}
