# Privacy and data — Brinca

> How Brinca handles personal data for V1. Covers Panama launch and Apple App Store global requirements. US launch (and COPPA) is a future trigger documented in section 8.

**Last updated:** April 15, 2026
**Owner:** Ivan
**Status:** Draft — requires review by a Panamanian attorney before shipping
**Related docs:** [`product-vision.md`](../product-vision.md), [`feature-specs/onboarding.md`](../feature-specs/onboarding.md), [`feature-specs/accounts-center.md`](../feature-specs/accounts-center.md), [`research/01-stack-decision.md`](../research/01-stack-decision.md)

> ⚠️ **Legal disclaimer.** The author of this document is not a lawyer and not an expert in Panamanian privacy law. Every section that cites a law, a specific retention period, or a consent requirement should be reviewed by a Panamanian attorney before the app is shipped. Draft text in section 4 is scaffolding, not a finished legal document.

---

## 1. Context and scope

### 1.1 What this document covers (V1)
- **Panama.** The initial launch market. Panamanian data protection law (Ley 81 of 2019, "Ley de Protección de Datos Personales") applies.
- **Apple App Store global requirements.** A privacy policy URL, in-app account deletion, privacy nutrition labels, and permission usage strings apply to any app in any country.
- **Brinca's posture.** Per section 3 of [`product-vision.md`](../product-vision.md), Brinca is used by adults (parents, therapists, coaches) who enter data *about* children. No child-facing interface, no child login, no child accounts. Data about children is processed as a consequence of caregivers using the app.

### 1.2 What this document does not cover
- **COPPA (US law).** Not triggered by a Panama launch. See section 8 for the future US launch checklist.
- **GDPR (EU law).** Not triggered by a Panama launch. Would require separate work if the app is listed in EU App Stores.
- **Kids category.** Per Gap 3 discussion, Brinca submits to Health & Fitness / Productivity / Education, not the Kids category. Kids-category-specific rules (parental gate on external links, no third-party SDKs, etc.) do not apply.

### 1.3 Triggers that require this document to be revisited
- Listing the app in the US App Store → section 8 becomes active work.
- Adding a child-facing UI, child login, or a companion Kids app → the entire posture changes; assume full COPPA and Apple Kids-category rules apply.
- Adding analytics SDKs beyond the current stack (Sentry, RevenueCat) → re-audit in section 6.
- Adding any advertising SDK → triggers major review; advertising to minors has additional constraints in most jurisdictions.

---

## 2. Data inventory

Every field the app writes, grouped by subject.

### 2.1 Parent (account holder) data
| Field | Source | Storage | Purpose |
|---|---|---|---|
| Email | Onboarding | Supabase Auth | Authentication, account recovery |
| Password | Onboarding (hashed by Supabase) | Supabase Auth | Authentication |
| Display name | Onboarding | Supabase DB | UI personalization |
| Persona type (parent/therapist/coach/teacher/other) | Onboarding | Supabase DB | Product analytics, future personalization |
| Profile photo | Accounts Center | Supabase Storage | UI personalization |
| Family membership + role | System | Supabase DB | Access control (RLS) |
| Last sign-in timestamp | Supabase Auth | Supabase Auth | Session management |

### 2.2 Child data
| Field | Source | Storage | Purpose |
|---|---|---|---|
| Name | Onboarding / Settings | Supabase DB + local SQLite | Display |
| Date of birth | Onboarding / Settings | Supabase DB + local SQLite | Age display, future age-based features |
| Gender | Onboarding / Settings | Supabase DB + local SQLite | Future personalized language |
| Country of residence | Settings | Supabase DB + local SQLite | Display |
| Grade level | Settings | Supabase DB + local SQLite | Display |
| School calendar | Settings | Supabase DB + local SQLite | Grade-level update prompts (not shown) |
| Profile photo | Onboarding / Settings | Supabase Storage + local file cache | Display |
| Weight history | Settings | Supabase DB + local SQLite | Progress tracking |
| Height history | Settings | Supabase DB + local SQLite | Progress tracking |
| External activities | Settings | Supabase DB + local SQLite | Display |

### 2.3 Activity and session data (belongs to a child)
| Field | Source | Storage | Purpose |
|---|---|---|---|
| Activity definitions (name, drills, tracking elements, tier rules) | Activity Builder | Supabase DB + local SQLite | Core functionality |
| Session records (timestamps, duration) | Session logging | Supabase DB + local SQLite | Core functionality |
| Drill results (element values) | Session logging | Supabase DB + local SQLite | Core functionality |
| Session notes (free text) | Session logging | Supabase DB + local SQLite | User-entered context |
| Session photos | Session logging | Supabase Storage + local file cache | User-entered context |
| Drill voice recordings | Session logging (Voice Note element) | Supabase Storage + local file cache | User-entered context |
| Currency ledger entries | Session completion | Supabase DB + local SQLite | Rewards system |
| Accolade unlocks | Session completion | Supabase DB + local SQLite | Rewards system |

### 2.4 Device and technical data
| Field | Source | Storage | Purpose |
|---|---|---|---|
| Crash reports (stack traces, device model, OS version) | Sentry SDK 8 | Sentry (third-party) | Debugging |
| Purchase state (subscription status, product IDs) | RevenueCat SDK | RevenueCat (third-party) | Subscription management |
| Anonymous app user ID | RevenueCat SDK | RevenueCat (third-party) | Cross-device purchase linking |

### 2.5 What is explicitly NOT collected
- Device advertising identifiers (IDFA).
- Location (GPS, IP geolocation).
- Contacts, calendars.
- Microphone audio outside the in-app Voice Note element (no background recording, no session-level voice notes).
- Behavioral analytics (no Google Analytics, Mixpanel, Amplitude, etc., in V1).
- Third-party advertising data.

> **iOS permission required:** `NSMicrophoneUsageDescription` must be set in `app.config.ts` with a user-facing explanation. Suggested string: "Brinca uses the microphone only when you tap record on a Voice Note during a practice session." Flag for the Phase 1 build-config task.

---

## 3. Consent mechanism for V1

### 3.1 Approach
V1 uses **self-attestation** consent via a terms of service and privacy policy checkbox in onboarding Step 1 (per [`feature-specs/onboarding.md`](../feature-specs/onboarding.md)). The adult creating the account confirms they have the authority to enter data about the child they add in Step 2.

This is the minimum legally defensible posture for Panama and a general-audience app in Apple's App Store. It is **not** sufficient for COPPA in the US — see section 8.

### 3.2 Exact consent language (to be added to onboarding checkbox)

**English:**
> I agree to the [Terms of Service] and [Privacy Policy]. If I add a child to this account, I confirm I am that child's parent or legal guardian, or I have permission from a parent or legal guardian to record information about the child for the purposes described in the Privacy Policy.

**Spanish:**
> Acepto los [Términos del Servicio] y la [Política de Privacidad]. Si agrego a un niño a esta cuenta, confirmo que soy el padre, madre o tutor legal del niño, o que tengo el permiso de uno de ellos para registrar información sobre el niño con los fines descritos en la Política de Privacidad.

### 3.3 When consent is recorded
The user's acceptance (timestamp, policy version) is stored on the account record at signup. If the privacy policy changes materially, the app must re-prompt for consent on next open — tracked via a version number in the user record.

### 3.4 Upgrade path
For a US launch, self-attestation is replaced with verifiable parental consent via one of the FTC-approved methods (credit card transaction, government ID check, video call, facial recognition, or a COPPA Safe Harbor provider). See section 8.

---

## 4. Privacy policy — draft

> ⚠️ **DRAFT — NOT LEGAL TEXT.** The policy below is a scaffold. A Panamanian attorney must review and finalize before it goes on the App Store listing or the app links to it. The structure matches what Apple requires and what Ley 81 of 2019 expects from a data controller, to the best of the author's non-expert understanding.

### 4.1 English draft

```
Privacy Policy — Brinca

Effective date: [TBD]

1. Who we are
Brinca is operated by [legal entity name, Panama]. For questions
about this policy, contact privacy@[domain].

2. What this app does
Brinca is a tool for parents, therapists, coaches, and other adult
caregivers to track structured practice sessions with children they are
responsible for. The app is used by adults. Children do not use the app
directly.

3. Information we collect
We collect:
- Account information: email, password (stored encrypted), display name,
  role description (parent, therapist, coach, teacher, other), profile
  photo (optional).
- Information about children you add to your account: name, date of
  birth, gender, country of residence, grade level, optional profile
  photo, optional weight and height history, optional external-activity
  descriptions.
- Activity and session information you record: activity names, drill
  definitions, counts, timer values, checklist results, free-text notes,
  and optional photos.
- Technical information: crash reports (via Sentry), subscription status
  (via RevenueCat). These contain a random app-generated identifier, not
  your name or email.

We do not collect location, contacts, microphone audio, advertising
identifiers, or behavioral analytics.

4. How we use this information
- To provide the core features of the app (tracking sessions, showing
  progress, managing rewards).
- To authenticate your account.
- To diagnose crashes and errors.
- To manage your subscription (if you purchase one).
- We do not use your information to show advertisements, and we do not
  sell your information.

5. Who we share information with
- Supabase, our database and authentication provider, which stores your
  data on our behalf.
- Sentry, which receives crash reports.
- RevenueCat, which receives subscription state.
- Apple, which processes payments for subscriptions.
- Family members you invite — anyone you add to your family in the app
  can see the shared children's profiles and session data, according to
  the role you assigned them.

We do not sell personal information to anyone.

6. Data retention
- Account and child information is retained while your account is active.
- Session records, photos, and rewards history are retained while your
  account is active.
- When you delete your account, all personal data is deleted from our
  active systems within 30 days. Encrypted backups may retain data for
  up to 90 days before being overwritten.
- Crash reports are retained by Sentry for 90 days.

7. Your rights
Under Panamanian law (Ley 81 of 2019), you may request access to,
correction of, or deletion of your personal information. You may delete
your account and all associated data directly from Settings > Accounts
Center > Delete account.

8. Children
Brinca is designed for adult caregivers. Children do not create
accounts and do not use the app directly. Information about children is
entered by the caregiver, who confirms during sign-up that they are the
child's parent or legal guardian, or that they have a parent's or
guardian's permission.

9. Changes to this policy
If we change this policy in a material way, we will notify you inside
the app and require you to accept the new version before continuing to
use the app.

10. Contact
privacy@[domain]
```

### 4.2 Spanish draft

```
Política de Privacidad — Brinca

Fecha de vigencia: [por definir]

1. Quiénes somos
Brinca es operada por [nombre de la entidad legal, Panamá]. Para
consultas sobre esta política, contacte a privacy@[dominio].

2. Qué hace esta aplicación
Brinca es una herramienta para padres, terapeutas, entrenadores y
otros adultos responsables del cuidado de niños, que les permite
registrar sesiones estructuradas de práctica con los niños a su cargo.
La aplicación es utilizada por adultos. Los niños no usan la
aplicación directamente.

3. Información que recopilamos
Recopilamos:
- Información de la cuenta: correo electrónico, contraseña (almacenada
  cifrada), nombre para mostrar, tipo de rol (padre o madre, terapeuta,
  entrenador, maestro, otro), foto de perfil (opcional).
- Información sobre los niños que usted agrega a su cuenta: nombre,
  fecha de nacimiento, género, país de residencia, grado escolar, foto
  de perfil opcional, historial opcional de peso y altura, descripciones
  opcionales de actividades externas.
- Información de actividades y sesiones que usted registra: nombres de
  actividades, definiciones de ejercicios, conteos, valores de
  temporizador, resultados de listas de verificación, notas de texto
  libre y fotos opcionales.
- Información técnica: reportes de errores (vía Sentry), estado de
  suscripción (vía RevenueCat). Esta información contiene un
  identificador aleatorio generado por la aplicación, no su nombre ni
  correo electrónico.

No recopilamos ubicación, contactos, audio de micrófono, identificadores
de publicidad ni análisis de comportamiento.

4. Cómo usamos esta información
- Para proveer las funciones principales de la aplicación (registro de
  sesiones, visualización de progreso, gestión de recompensas).
- Para autenticar su cuenta.
- Para diagnosticar fallos y errores.
- Para gestionar su suscripción (si adquiere una).
- No usamos su información para mostrar publicidad y no vendemos su
  información.

5. Con quién compartimos información
- Supabase, nuestro proveedor de base de datos y autenticación, que
  almacena sus datos en nuestro nombre.
- Sentry, que recibe reportes de errores.
- RevenueCat, que recibe el estado de suscripción.
- Apple, que procesa los pagos de suscripciones.
- Miembros de familia que usted invite — cualquier persona que usted
  agregue a su familia dentro de la app puede ver los perfiles de los
  niños compartidos y los datos de sesiones, según el rol que usted le
  haya asignado.

No vendemos información personal a nadie.

6. Retención de datos
- La información de cuenta y de los niños se conserva mientras su
  cuenta esté activa.
- Los registros de sesiones, fotos e historial de recompensas se
  conservan mientras su cuenta esté activa.
- Cuando usted elimina su cuenta, todos los datos personales se eliminan
  de nuestros sistemas activos en un plazo de 30 días. Las copias de
  seguridad cifradas pueden retener los datos hasta por 90 días antes
  de ser sobrescritas.
- Los reportes de errores son retenidos por Sentry durante 90 días.

7. Sus derechos
Bajo la Ley 81 de 2019 de Panamá, usted puede solicitar acceso,
rectificación o eliminación de su información personal. Puede eliminar
su cuenta y todos los datos asociados directamente desde
Configuración > Centro de Cuentas > Eliminar cuenta.

8. Niños
Brinca está diseñada para adultos responsables. Los niños no crean
cuentas y no usan la aplicación directamente. La información sobre los
niños es ingresada por el adulto responsable, quien confirma durante el
registro que es el padre, madre o tutor legal del niño, o que cuenta
con el permiso de uno de ellos.

9. Cambios en esta política
Si modificamos esta política de forma material, le notificaremos dentro
de la aplicación y le requeriremos aceptar la nueva versión antes de
continuar usando la app.

10. Contacto
privacy@[dominio]
```

### 4.3 Hosting
The privacy policy must be hosted at a stable public URL before App Store submission. Apple reviewers check the link. The same URL is referenced in the onboarding consent checkbox.

---

## 5. Account deletion

### 5.1 Already specced
[`feature-specs/accounts-center.md`](../feature-specs/accounts-center.md) defines a two-step account deletion flow: native iOS alert confirmation, then a text field requiring the user to type "DELETE." This satisfies Apple's in-app account deletion requirement (App Review Guideline 5.1.1(v), effective June 30, 2022).

### 5.2 What deletion must do
On final confirmation, the app:
1. Invalidates the user's Supabase Auth session.
2. Triggers server-side deletion of: the user record, their family (if they are the Admin and the last member), all child records under that family, all sessions, drill results, session notes, session photos in Storage, currency ledger entries, accolade unlocks, reward records, measurement entries, external activities, member invites.
3. Removes the Sentry user ID association so future crashes are not linked to the deleted account.
4. Revokes the RevenueCat user's app user ID (per RevenueCat's delete endpoint).
5. Clears local SQLite, MMKV, and expo-secure-store on the device.
6. Returns the user to the login screen.

### 5.3 Co-admin and the deletion open question
[`feature-specs/accounts-center.md`](../feature-specs/accounts-center.md) has an open question: if the Admin deletes their account but Co-admins exist, does a Co-admin become the new Admin, or is everything deleted? This must be resolved before account deletion can be implemented. The privacy-sensitive answer is clearer if chosen: **if a Co-admin exists, offer to transfer ownership before destructive deletion; if the user proceeds anyway, delete everything.** Flag this question for Ivan to close.

### 5.4 Retention after deletion
- Active systems: 30 days or less.
- Encrypted backups: up to 90 days before overwrite.
- Third-party services: Sentry 90 days; RevenueCat per their retention (confirm with their support).

These numbers are stated in the privacy policy draft (section 4) and must match whatever is actually true in Supabase's backup schedule — verify before ship.

---

## 6. SDK audit

### 6.1 Sentry (SDK 8)
**What Sentry collects by default:**
- Crash stack traces, breadcrumbs (user actions leading up to an error).
- Device info: model, OS version, locale, free memory, app version.
- User ID if you call `Sentry.setUser({ id })`.
- Email and IP address if you configure `sendDefaultPii: true`.

**What to configure for Brinca:**
- **Do not** set `sendDefaultPii: true`. Leave the default (off).
- **Do not** pass a child identifier into `Sentry.setUser()`. Set user only with the parent's app user ID (Supabase auth user ID).
- Scrub free-text session notes from breadcrumbs — notes may contain personal information entered by the parent ("Andrei struggled with left-side balls"). Configure `beforeBreadcrumb` to drop text-input breadcrumbs.
- Confirm Sentry's EU data residency if Panamanian law requires it — most likely not, but verify. Sentry offers US, EU, and dedicated regions.

### 6.2 RevenueCat
**What RevenueCat collects by default:**
- App User ID (a UUID you generate — do not use email or child name).
- Purchase history, subscription state, entitlements.
- Device info similar to Sentry.

**What to configure for Brinca:**
- Generate a random app user ID at account creation (UUID), store on the user record, pass to RevenueCat. Never pass email, name, or child identifiers.
- RevenueCat's Customer Center feature is safe to enable — it shows the user their own subscription without exposing data.
- Confirm RevenueCat's data retention and deletion endpoint behavior.

### 6.3 Supabase (not a third party in the usual sense — it's your backend)
Supabase stores everything. What matters for privacy:
- RLS policies must prevent any user from reading another family's data. Per [`ux-conventions.md`](../ux-conventions.md), the policy chain is `auth.uid() → family_members → family_id`.
- Supabase Storage for photos must use signed URLs, not public URLs.
- Supabase Auth sessions are stored in `expo-secure-store`, not `AsyncStorage`, per [`research/01-stack-decision.md`](../research/01-stack-decision.md).

### 6.4 Apple
Processes subscription payments. Receives App Store transaction data. Not optional, not configurable.

### 6.5 Privacy nutrition labels (App Store Connect)
Brinca's label, based on this inventory, should declare:
- **Data linked to you:** contact info (email, name), user content (photos, notes, drill voice recordings), identifiers (user ID), usage data (via Sentry crashes), purchases (via RevenueCat).
- **Data not linked to you:** none.
- **Data used to track you:** none (Brinca does not track across apps/sites).

Fill in the full App Store Connect form using the section 2 inventory as the source of truth.

---

## 7. Data retention and deletion

### 7.1 Retention during active use
Unlimited retention of session data, photos, and rewards history while the account is active. The product depends on long-running history to show progress.

### 7.2 Retention after account deletion
Per section 5.4: active systems within 30 days, backups within 90 days, third-party services per their policies.

### 7.3 User-initiated partial deletion
The user can delete individual sessions from the Stats tab ([`feature-specs/stats.md`](../feature-specs/stats.md)). Deleted session data is removed from active systems immediately; backups may retain it for up to 90 days before overwrite. Currency ledger entries associated with a deleted session are **preserved** per the V1 rule in [`rewards-levels-accolades.md`](../rewards-levels-accolades.md) — note this in the privacy policy if reviewers flag it.

### 7.4 Cascade on child deletion
If a specific child is deleted (independent of account deletion), cascade-delete: their profile data, sessions, drill results, photos, measurements, ledger entries, accolade unlocks, rewards. The family remains; other children remain. This is an open question for the schema doc — flagged.

### 7.5 The "right to be forgotten" (Ley 81 and future GDPR/COPPA)
The in-app delete-account flow is Brinca's primary mechanism for this right. For users who can no longer access the app (forgotten password, device lost), a manual email-based deletion request path must exist — send to `privacy@[domain]`, verified by email, processed within 30 days. Document this in the privacy policy.

---

## 8. US launch readiness checklist

This is the work that becomes required if and when Brinca lists in the US App Store. **None of it is required for V1.** Keep as a reference for the decision moment.

### 8.1 COPPA (US federal law)
- [ ] Switch consent mechanism from self-attestation (section 3) to verifiable parental consent. Approved methods:
  - Credit card transaction (small charge, immediately refunded).
  - Government ID check.
  - Video call with a live agent.
  - Facial recognition matching a government ID.
  - A COPPA Safe Harbor provider (kidSAFE, PRIVO, TRUSTe) that handles consent on your behalf.
- [ ] Add a parental consent gate before any child data leaves the device for Supabase, even though it would block onboarding offline.
- [ ] Data minimization audit: confirm every child-data field collected is actually used.
- [ ] Parental access mechanism: parents must be able to review what data has been collected about their child and delete it. The account deletion flow covers deletion; review access may require a new screen.
- [ ] Direct notice to parents: a short COPPA-specific notice in addition to the privacy policy.
- [ ] Consider COPPA Safe Harbor certification (kidSAFE, PRIVO) — reduces FTC enforcement risk.

### 8.2 FTC Safe Harbor rules (February 2026)
- [ ] Evaluate whether Brinca can claim the "general audience operator" safe harbor (collecting data only for age verification). Given Brinca's honest posture, likely no — but confirm with counsel.

### 8.3 COPPA 2.0 (in Congress)
- [ ] Monitor for passage. Would extend protections to teens 13–16 and require an "eraser button" (satisfied by account deletion).

### 8.4 Apple App Store US-specific items
- [ ] Decide on Kids category vs general audience for the US. If Kids category: no third-party ads (already true), parental gate on external links, stricter SDK rules.
- [ ] Adopt Apple Declared Age Range API (iOS 18+) if available — age verification without storing birthdate.

### 8.5 State laws (monitor)
- [ ] Texas: age verification required (effective January 2026).
- [ ] Utah: effective May 6, 2026.
- [ ] Louisiana: effective July 1, 2026.

### 8.6 Operational
- [ ] Update privacy policy with COPPA-specific sections.
- [ ] Update App Store Connect privacy nutrition labels if data collection changes.
- [ ] SDK re-audit: Sentry and RevenueCat default behaviors with child accounts.

---

## 9. Open questions

- [ ] Legal entity name and address in Panama (for the privacy policy header and Apple App Store listing).
- [ ] Privacy contact email address.
- [ ] Privacy policy hosting URL.
- [ ] Final Panamanian attorney review of sections 3, 4, 5, 7.
- [ ] Co-admin ownership transfer on Admin deletion — see section 5.3 and [`feature-specs/accounts-center.md`](../feature-specs/accounts-center.md).
- [ ] Supabase backup retention — confirm the exact number of days matches what section 4 and 7 promise.
- [ ] Sentry data residency requirement under Ley 81 (likely not required; confirm).
- [ ] Manual email-based deletion flow for users who have lost account access (section 7.5) — process and SLA.
