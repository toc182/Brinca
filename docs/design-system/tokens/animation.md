# Animation

All motion uses `react-native-reanimated`. Every animation wraps in a `ReduceMotion.System` check — fall back to instant state change when reduce-motion is enabled.

---

## Motion tokens

| Context | Type | Config |
|---|---|---|
| Stack push | timing | 300ms, `Easing.bezier(0.32, 0.72, 0, 1)` |
| Stack pop | timing | 250ms, `Easing.bezier(0.4, 0, 1, 1)` |
| Modal slide-up | spring | mass: 1, stiffness: 180, damping: 20 |
| Sheet open | spring | mass: 1, stiffness: 200, damping: 22 |
| Sheet close | spring | mass: 1, stiffness: 160, damping: 26 |
| Toast enter | spring | mass: 0.8, stiffness: 220, damping: 18 |
| Toast exit | timing | 200ms, `Easing.in(cubic)` |
| Button press (scale 0.96) | timing | 80ms, `Easing.out(quad)` |
| Button release — adult | spring | mass: 0.6, stiffness: 300, damping: 22 (no bounce) |
| Button release — kid | spring | mass: 0.6, stiffness: 300, damping: 15 (small bounce) |
| Counter / celebration bounce | spring | mass: 1, stiffness: 140, damping: 8 (~8% overshoot) |
| Hero celebration | sequence | scale 0→1.1→1 mass:1.2 stiffness:110 damping:7 + 1800ms confetti |
| Checkmark draw | timing | 350ms, `Easing.bezier(0.65, 0, 0.35, 1)` |
| Tab icon active | spring | mass: 0.8, stiffness: 200, damping: 15 — scale 1→1.1 |
| Progress ring fill | timing | 900ms, `Easing.out(cubic)` |
| List item stagger | spring | `FadeInDown.springify().damping(15).mass(1).stiffness(150).delay(i*40)` |
