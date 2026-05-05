# Data persistence

How and when changes are saved across the app.

---

## Per-context behavior

| Context | Behavior |
|---|---|
| Session logging — mid-session | Auto-save every action immediately. No save button. Progress is never lost. |
| Session logging — end of session | Explicit "Finish Session" button to mark the session complete and close it. |
| Creating or editing profiles and activities | Explicit Save button. Changes are not saved until the user confirms. |
