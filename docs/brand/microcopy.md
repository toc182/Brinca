# Microcopy

All bilingual strings used across the app. English and Spanish are equal citizens — never treat one as a translation afterthought.

For voice, register, and tone, see `personality.md`.
For per-context empty-state copy with Capi expression, see `empty-state-copy.md`.

---

## Translation rules

1. **"Log out" vs "Sesión".** `sesión` means both login session and therapy session. Use `Cerrar sesión` for sign-out only. For therapy use `Empezar / Terminar sesión` with icon context. If ambiguous, prefer `actividad` or `práctica`.
2. **Streak = `Racha`.** Keep it. Do not substitute with `serie` or `secuencia`.
3. **"Crushed it" — never translate literally.** Use `¡Lo lograste!` (pan-LatAm) or `¡La rompiste!` (Mexico / Argentina).
4. **"Session" splits by role.** Sports: `sesión de entrenamiento`. Therapy: `sesión`. Kid-visible: `práctica` or `turno`.
5. **"Personal best" → `Récord personal` / `Tu mejor marca`.** "PB" has no recognition in Spanish.
6. **"Upgrade" ≠ `Actualizar`.** `Actualizar` means software update. Use `Mejorar plan` or `Pasar a Premium`.
7. **Rewards use diminutives on kid screens.** `estampita` (sticker), `medallita` (medal). Use `insignia` only on clinical exports.
8. **Pick one register per screen.** Default `tú`; `usted` only on clinician, legal, billing, verification. Never mix.

### Quick reference

| Concept | When | English | Spanish |
|---|---|---|---|
| Sign-out action | Always | Log out | Cerrar sesión |
| Therapy / sport session | By role | Session | Sesión / práctica / turno (context-dependent) |
| Streak | Always | Streak | Racha |
| Informal achievement | Kid-visible | Crushed it | ¡Lo lograste! / ¡La rompiste! (regional) |
| Personal best | Stats screens | Personal best / PB | Récord personal / Tu mejor marca |
| Upgrade prompt | Adult only | Upgrade | Mejorar plan / Pasar a Premium |
| Sticker reward | Kid-visible | Sticker | Estampita |
| Medal reward | Kid-visible | Medal | Medallita |

---

## CTA buttons

| Context | English | Spanish |
|---|---|---|
| Save | Save | Guardar |
| Start session | Start session | Empezar sesión |
| Pause session | Pause | Pausar |
| Resume session | Resume | Reanudar |
| Finish session | Finish session | Terminar sesión |
| Add photo | Add Photo | Agregar foto |
| Change photo | Change Photo | Cambiar foto |
| Add note | Add Note | Agregar nota |
| Edit note | Edit Note | Editar nota |
| Log out | Log out | Cerrar sesión |
| Add child | Add child | Agregar niño/a |
| Upgrade | Upgrade | Mejorar plan |
| Continue | Continue | Continuar |
| Cancel | Cancel | Cancelar |
| Delete | Delete | Eliminar |
| Confirm | Confirm | Confirmar |
| Discard | Discard | Descartar |
| In progress (drill status) | In progress | En progreso |
| Add another photo | Add Another | Agregar otra |
| Remove photo (action) | Remove | Quitar |

---

## Confirmation toasts

| Event | English | Spanish |
|---|---|---|
| Session saved | Session saved | Sesión guardada |
| Profile created | Profile ready! | ¡Perfil listo! |
| Changes saved | Changes saved | Cambios guardados |
| Invite sent | Invite sent | Invitación enviada |
| Goal updated | Goal updated | Meta actualizada |

---

## Error toasts

| Event | English | Spanish |
|---|---|---|
| Offline | You're offline. We'll sync when you're back. | Sin conexión. Sincronizamos cuando vuelvas. |
| Sync failed | Couldn't sync. Tap to retry. | No se pudo sincronizar. Toca para reintentar. |
| Save failed | Couldn't save. Check your connection. | No se pudo guardar. Revisa tu conexión. |
| Login failed | That didn't work. Check your password. | No funcionó. Revisa tu contraseña. |
| Generic crash | Something broke on our end. Try again. | Algo falló de nuestro lado. Intenta otra vez. |

---

## Celebrations (kid-visible)

| Event | English | Spanish |
|---|---|---|
| 3-day streak | 3-day streak! | ¡Racha de 3 días! |
| 7-day streak | A whole week — keep going! | ¡Una semana entera, sigue así! |
| 30-day streak | 30 days strong. You did that. | 30 días seguidos. Lo lograste. |
| Personal best | New best! +5 from last time. | ¡Nuevo récord! +5 que la última vez. |
| Reward earned | You unlocked a sticker! | ¡Desbloqueaste una estampita! |
| First session | First session done. Big step. | Primera sesión lista. Buen comienzo. |
| Goal hit | Goal hit! | ¡Meta cumplida! |

---

## Gentle misses

| Event | English | Spanish |
|---|---|---|
| Missed a day | Rest day — come back tomorrow. | Día de descanso — nos vemos mañana. |
| Session not finished | We saved what you did. Finish later? | Guardamos lo que hiciste. ¿Terminamos después? |
| Skipped rep | No problem — on to the next one. | Sin problema — vamos a la siguiente. |
| Streak paused | Streak paused. Start a new one anytime. | Racha en pausa. Empieza otra cuando quieras. |

---

## Upgrade nudges (adult-only)

| Context | English | Spanish |
|---|---|---|
| Session limit | You've hit your free sessions. Go unlimited? | Alcanzaste las sesiones gratis del mes. ¿Pasar a ilimitadas? |
| Add second child | Add more kids with a family plan. | Agrega más niños con el plan familiar. |
| Export report | Exports are a premium feature. See plans. | Exportar es una función premium. Ver planes. |
| Therapist seats | Invite your whole team with Clinician Pro. | Invita a todo tu equipo con Clinician Pro. |
| Generic | Unlock everything. Cancel anytime. | Desbloquea todo. Cancela cuando quieras. |

---

## Form validation

| Rule | English | Spanish |
|---|---|---|
| Required | This field is required. | Este campo es obligatorio. |
| Max length | Name must be under 50 characters. | El nombre debe tener menos de 50 caracteres. |
| Min length | Use at least 2 characters. | Usa al menos 2 caracteres. |
| Email format | Enter a valid email. | Ingresa un correo válido. |
| Age range | Age must be between 7 and 12. | La edad debe estar entre 7 y 12 años. |
| Password | Use 8+ characters, including a number. | Usa 8+ caracteres, incluye un número. |
