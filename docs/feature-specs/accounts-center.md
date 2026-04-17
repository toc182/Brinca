# Feature spec — Accounts Center

**Screen name:** Accounts Center
**File:** `docs/feature-specs/accounts-center.md`
**Last updated:** April 13, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`

---

## Purpose

The Accounts Center lets the parent manage their own account, control family membership and roles, and configure family-level settings.

---

## Entry points

- Settings → Accounts Center button
- Child switcher bottom sheet → "Go to Accounts Center" button

---

## What the screen shows

Content is organized in grouped sections, top to bottom.

### 1. Profile section
- Profile photo (circular, large) — tappable to change via system photo picker
- Display name — tappable to edit (opens modal)
- Email — tappable to edit (opens modal)
- Change password — tappable (opens modal)
- If no photo is set, show circular placeholder with the parent's initials

### 2. Family section
- Section header: "Family"
- Measurement units — inline toggle: Metric / Imperial
- Family members list — each row shows: photo (or initials), name, role label (Admin, Co-admin, Collaborator, Member)
- "Invite member" button at the bottom of the list
- Tapping a family member opens their detail screen (stack navigation)
- The Admin's own row is not tappable (cannot change own role or remove self)

### 3. Account section
- Sign in with Apple (future — visible but disabled, "Coming soon" label)
- Sign in with Google (future — visible but disabled, "Coming soon" label)
- Delete account

---

## Roles

| Role | Access | Who can assign | Who can remove |
|---|---|---|---|
| Admin | Full access. Manages everyone. Cannot be removed. One per family. | Auto-assigned to account creator | Cannot be removed |
| Co-admin | Full access. Can manage Collaborators and Members. | Admin only | Admin only |
| Collaborator | Create their own activities and drills, log sessions, see all activities. Cannot manage family members. | Admin or Co-admin | Admin or Co-admin |
| Member | Log sessions only. Cannot configure activities, drills, or rewards. | Admin or Co-admin | Admin or Co-admin |

---

## Invite flow

1. Parent taps "Invite member"
2. Modal opens with: email field, role picker (Co-admin, Collaborator, or Member)
3. Parent enters email, selects role, taps "Send invite"
4. Invite email sent to the address
5. Recipient taps the link → creates an account (or logs in if they have one) → automatically added to the family with the assigned role
6. New member appears in the family members list
7. Toast: "Invite sent to [email]."

### Role picker
- Admin cannot invite another Admin (only one Admin exists)
- Co-admins can only invite Collaborators and Members (Co-admin option not shown)

---

## Family member detail screen

Pushed in (stack navigation) when a family member row is tapped.

### What the screen shows
- Member photo (or initials) + name + email
- Current role label
- "Change role" button — opens bottom sheet with available roles
- "Remove from family" button — red text

### Change role
- Bottom sheet with available role options
- Admin can change anyone's role to: Co-admin, Collaborator, or Member
- Co-admin can change Collaborators and Members only (cannot promote to Co-admin)
- Selecting a role applies immediately. Toast: "Role updated."

### Remove from family
- Native iOS alert: "Remove [name] from your family? They will lose access to all children and session data."
- On confirmation → member removed, returns to Accounts Center, family list updates
- Toast: "Member removed."

---

## Edit display name (modal)

- Text field pre-filled with current name
- Max 50 characters
- "Save" button — disabled until a change is made
- Cancel button (top left) or swipe down to dismiss without saving
- On save → toast: "Changes saved."

---

## Edit email (modal)

- Text field pre-filled with current email
- Valid email format required — inline error: "Please enter a valid email address."
- Requires current password to confirm the change
- "Save" button — disabled until email is changed and password is entered
- Cancel button or swipe down to dismiss
- On save → verification email sent to new address. Toast: "Verification email sent to [new email]. Check your inbox."
- Email updates only after the new address is verified

---

## Change password (modal)

- Current password field
- New password field
- Confirm new password field
- Password requirements displayed below new password field (same as onboarding):
  - At least 8 characters
  - One uppercase letter
  - One number
  - One special character (!@#$%...)
- Each requirement checks off in real time
- "Save" button — disabled until all fields are valid and passwords match
- Cancel button or swipe down to dismiss
- On save → toast: "Password updated."
- If current password is wrong → inline error: "Current password is incorrect."

---

## Delete account

- Tapping "Delete account" triggers native iOS alert:
  - Title: "Delete your account?"
  - Message: "This will permanently delete your account, all children's profiles, all session data, and remove all family members. This cannot be undone."
  - Buttons: "Cancel" and "Delete" (red)
- On confirmation → second confirmation: text field requiring the user to type "DELETE" to proceed
- On final confirmation → account deleted, all data removed, user returned to login screen

---

## Screen states

| State | Behavior |
|---|---|
| Normal | Full account and family data displayed |
| Loading | Skeleton with shimmer animation |
| Offline | Subtle offline banner. Cached data shown. Edits that require network (email change, invite, delete) show toast: "You're offline. Please try again when connected." |
| Error | "Something went wrong. Please try again." with retry button |

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| Only one member in family (the Admin) | Family list shows only the Admin. No remove option. |
| Admin tries to remove themselves | Not possible — Admin row is not tappable |
| Co-admin tries to view/edit another Co-admin | Not possible — Co-admin rows are not tappable for other Co-admins |
| Invite sent to an email that already has an account | Recipient logs in and is added to the family automatically |
| Invite sent to an email already in the family | Inline error: "This person is already a member of your family." |
| Invite sent to an invalid email | Inline error: "Please enter a valid email address." |
| Member removed while they have a session in progress | Session is saved as incomplete. Member loses access on next app open. |
| Email change — new email already registered | Inline error: "An account with this email already exists." |
| Delete account with other family members | All members lose access. All data deleted. |
| Network unavailable during invite | Toast: "You're offline. Please try again when connected." |
| Network unavailable during delete | Toast: "You're offline. Please try again when connected." |

---

## Navigation and exit points

| Trigger | Navigation type | Destination |
|---|---|---|
| Tap profile photo | System photo picker | Photo selection |
| Tap display name | Modal | Edit display name |
| Tap email | Modal | Edit email |
| Tap "Change password" | Modal | Change password form |
| Tap "Invite member" | Modal | Invite form (email + role) |
| Tap a family member | Stack (push from right) | Member detail screen |
| Tap "Change role" on member detail | Bottom sheet | Role picker |
| Tap "Remove from family" | Native iOS alert | Confirmation |
| Tap "Delete account" | Native iOS alert | Two-step confirmation |
| Tap back from member detail | Stack (slide back) | Accounts Center |
| Tap back from Accounts Center | Stack (slide back) | Settings |

---

## Data read by this screen

- Parent profile (display name, email, photo)
- Family members list (name, email, photo, role)
- Family measurement unit preference
- Pending invites (if any)

## Data written by this screen

- Parent display name
- Parent email (with verification)
- Parent password
- Parent profile photo
- Family measurement unit preference (metric/imperial)
- Family member role changes
- Family member invites (email + role)
- Family member removals
- Account deletion

---

## Acceptance criteria

**Profile**
- [ ] Profile photo is displayed and tappable to change via system photo picker
- [ ] Display name is displayed and tappable — opens modal to edit with Save button
- [ ] Email is displayed and tappable — opens modal to edit, requires current password
- [ ] Email change sends verification to new address before updating
- [ ] Change password opens modal with current, new, and confirm fields
- [ ] Password requirements check off in real time as each is met
- [ ] If current password is wrong, inline error is shown

**Family**
- [ ] Measurement units toggle switches between Metric and Imperial
- [ ] All family members are listed with photo/initials, name, and role
- [ ] Tapping a member opens their detail screen
- [ ] Admin's own row is not tappable
- [ ] "Invite member" opens a modal with email field and role picker

**Invite flow**
- [ ] Admin can invite as Co-admin, Collaborator, or Member
- [ ] Co-admin can invite as Collaborator or Member only
- [ ] Invite email is sent on submission
- [ ] Toast confirms invite was sent
- [ ] Inviting an existing family member shows inline error
- [ ] Inviting an invalid email shows inline error

**Member detail**
- [ ] Shows member photo, name, email, and current role
- [ ] "Change role" opens bottom sheet with available roles
- [ ] Admin can change any role; Co-admin can change Collaborators and Members only
- [ ] Role change applies immediately with toast confirmation
- [ ] "Remove from family" triggers native iOS alert with confirmation
- [ ] After removal, returns to Accounts Center and list updates

**Delete account**
- [ ] First confirmation: native iOS alert with warning message
- [ ] Second confirmation: must type "DELETE" to proceed
- [ ] Account deletion removes all data and returns to login screen

**States**
- [ ] Skeleton with shimmer shown while loading
- [ ] Offline banner shown when disconnected
- [ ] Network-dependent actions (invite, email change, delete) blocked with toast when offline

---

## Open questions

- [ ] Should pending invites be visible in the family members list (e.g., "[email] — Pending")?
- [ ] Can an invite be revoked before the recipient accepts?
- [ ] Should there be a time limit on invites (e.g., expire after 7 days)?
- [ ] What happens if the Admin deletes their account but Co-admins exist — does a Co-admin become the new Admin, or is everything deleted?
- [ ] Should the "Coming soon" social login buttons be shown at all, or hidden entirely until implemented?
- [ ] Should the parent be able to see a log of who made changes (audit trail), or is that V2?
- [ ] Should Collaborators and Members be able to see the family members list (read-only), or is it hidden from them entirely?

---

## Mockups

[Link to Figma file — to be added after design phase]
