# Disabled states

| Element | Treatment |
|---|---|
| Primary button | bg `surface-disabled` `#F4F3F8`, text `text-disabled` `#A7A4BD`, no shadow, no ripple |
| Secondary / ghost button | border `border-subtle`, text `text-disabled` |
| Icon button | Icon `text-disabled`, no bg change |
| Toggle / Switch | Track `border-default` @ 50%, thumb `surface` |
| Checkbox / Radio | Border `border-default`, fill `text-disabled` if checked |
| Link | Color `text-disabled`, no underline, `pointerEvents: 'none'` |

**Touch feedback:** `disabled={true}` on `Pressable`. No haptics. Optional tooltip on attempted press.
