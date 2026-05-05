# Focus & selected states

Two distinct visual systems: **focus** for keyboard / VoiceOver, **selected** for touch.

---

## Focus (keyboard / VoiceOver)

| Element | Indicator |
|---|---|
| Button | 2pt outline `primary-500`, 2pt outside offset |
| Input | 2pt border + 3pt `primary-500` @ 24% halo |
| Card | 2pt inner stroke `primary-500` |
| Chip | 2pt outer ring `primary-500`, 2pt offset |

---

## Selected (touch)

| Component | Adult | Kid |
|---|---|---|
| Card | 1.5pt `primary-500` border + `primary-50` bg | 3pt border + `primary-100` bg + check-circle icon top-right |
| Bottom tab | Icon fill + label `primary-500` + 2pt underline | Pill `primary-100` bg, icon fill + label `primary-700` |
| Filter chip | `primary-500` bg, white text, leading check | Same + scale 1→1.1 spring |
| Radio | Outer `primary-500`, inner dot, 20pt | Same, 28pt |
