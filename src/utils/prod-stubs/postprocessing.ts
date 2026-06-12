// Production stand-in for @react-three/postprocessing (vite resolve.alias,
// prod builds only). The EffectComposer/Bloom subtree only renders behind the
// leva `usePostBloom` toggle, fixed false in prod — the real stack (plus the
// n8ao dependency it drags in, ~40KB gzipped) is unreachable dead weight.
// If Bloom ever ships for real, delete this stub and the alias.
export function EffectComposer(_props: Record<string, unknown>): null {
    return null
}

export function Bloom(_props: Record<string, unknown>): null {
    return null
}
