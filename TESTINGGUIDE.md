# Brinca Testing Guide

Plain-language reference for how to test changes on TocPhone 17 (and other devices), at home and at work.

---

## The pieces

- **Your phone (TocPhone 17)** runs the Brinca app. There can be two flavors of "the app" installed at once:
  - **Dev build** — an empty shell. Loads JavaScript from your computer over WiFi. Used for daily development.
  - **TestFlight build** — fully self-contained. Runs without a computer. Used for real-world testing and pre-App-Store validation.

- **Metro** = the local JavaScript bundler that runs on your computer (`npx expo start`). It serves JavaScript to the dev build over WiFi.

- **EAS Build** = Expo's cloud build service. Builds an iOS binary for you in the cloud. Works from any computer (Mac, PC, doesn't matter).

- **EAS Update** = pushes JavaScript-only changes over the internet directly to phones. No rebuild needed. Phone picks them up next time the app opens.

- **TestFlight** = Apple's official testing program. You upload a build → Apple processes it (~30–60 min) → testers get a notification → they install on their phone.

---

## The six common scenarios

### 1. At work (PC), I need to test a change
- **JS-only change** (90% of the time): On your PC, run `npx expo start --dev-client`. Open the dev build on your phone (same WiFi as PC). Save a file → app reloads. Free.
- **Native change** (added a native package, bumped Expo SDK, anything in `ios/` or `android/`): You **cannot** build natively on Windows. Run `eas build --platform ios --profile development` from your PC. Builds in the cloud (~30 min). When done, install the new dev build on your phone via the link EAS gives you. Then resume the JS-only flow above. Costs one EAS Build credit.
- If your work WiFi blocks phone-to-PC traffic, add `--tunnel` to the expo start command. Slower, but works through any network.

### 2. At home (Mac), I need to test a change
- **JS-only change**: same as above. `npx expo start --dev-client`, phone on same WiFi. Free.
- **Native change**: two options:
  - **Local** (recommended): `npx expo run:ios --device "TocPhone 17"`. Fast, free, ~2–10 min after the first build.
  - **Cloud**: same `eas build` command as the work flow. Slower, costs a credit, but doesn't tie up your Mac.

### 3. When does the phone need to be plugged in?
Almost never:
- **First time only** — pair phone with Mac in Xcode (Window → Devices and Simulators), check "Connect via network." After that, never again unless you switch Macs.
- **Never** for JS changes (Metro works over WiFi).
- **Never** for cloud builds (EAS gives you a download link, install over WiFi).

The phone does need to be **on the same WiFi as your computer** to use Metro normally. (Or use `--tunnel` for any-network access.)

### 4. When do I use TestFlight?
Three reasons:
- **Share a build with someone** who isn't at your computer (see #5).
- **Validate the actual production binary** for a few days before pushing to the App Store.
- **Use the app away from any computer** — on a plane, on vacation, demoing to a stranger. The TestFlight build is fully self-contained.

For day-to-day dev work, you don't need TestFlight.

### 5. Someone else needs to test
- In **App Store Connect** (web), add their Apple ID email as a TestFlight tester.
- Run `eas build --platform ios --profile production && eas submit --platform ios --latest` from any computer.
- Wait ~30 min for the cloud build, then ~30–60 min for Apple to process.
- Tester gets an email from TestFlight, installs the TestFlight app on their phone if they don't already have it, taps to install Brinca.
- Every future submitted build → they get a notification to update.

### 6. I want to use the app away from any computer
- You need a **TestFlight build** on your phone. The dev build needs Metro, which needs a computer.
- Once a TestFlight build is installed on TocPhone 17, you can take the phone anywhere — airplane mode, no WiFi, doesn't matter — and the app runs by itself.
- One-time setup: do scenario #5's steps once with yourself as the tester. From then on, you'll have both flavors on your phone (dev build + TestFlight build) and can switch between them.

---

## Cost questions

### Which actions cost money?

**Free, no credits ever:**
- Metro (`npx expo start`)
- Local native builds on Mac (`npx expo run:ios`)
- `eas submit` (just uploads an existing build to Apple)
- TestFlight itself
- App Store distribution (covered by your $99/year Apple Developer membership, already paid)

**Costs EAS credits (free tier first, then paid):**
- `eas build` — every cloud build, regardless of profile (development / preview / production)
- `eas update` — over-the-air JS updates. Generous free tier (thousands of downloads/month). For a solo project with one tester, you basically can't hit the limit.

EAS pricing as of 2026: 30 free builds/month on free plan with slow queue, OR pay-per-build (~$1–2 each) on usage-based, OR $99/month for unlimited+priority. Verify at expo.dev/pricing.

### Does running a local Mac build save EAS credits?
**Yes — for your own dev iteration.** Local builds replace EAS builds entirely when you're testing on your own phone.

**No — for distribution.** Local builds *cannot* update TestFlight, install on anyone else's phone, or be submitted to the App Store. Apple requires distribution-signed binaries from a proper distribution flow. To update TestFlight you must run a cloud build (`eas build --profile production`) and `eas submit`.

### So what's the most cost-efficient daily flow?
- **At home (Mac):** local builds + Metro = $0.
- **At work (PC):** Metro for JS = $0. Cloud build only when you actually changed native code = ~1 credit per native change.
- **TestFlight updates:** unavoidable cloud build, but only when you're ready to share or pre-validate. Don't burn credits doing TestFlight updates for dev iteration.

---

## Quick decision tree

| What you want | What to run | Where | Cost |
|---|---|---|---|
| See a JS change on phone | `npx expo start --dev-client` | Any computer, same WiFi as phone (or `--tunnel`) | Free |
| Native change, you're at home | `npx expo run:ios --device "TocPhone 17"` | Mac only | Free |
| Native change, you're at work | `eas build --platform ios --profile development` | Any computer | 1 EAS credit |
| Push JS update to your phone (or anyone with the dev build) | `eas update --branch production` | Any computer | Free (within tier) |
| Update TestFlight | `eas build --platform ios --profile production && eas submit --platform ios --latest` | Any computer | 1 EAS credit |
| Test off-WiFi / on a plane | Use the TestFlight build (already installed) | Phone only | Free |

---

## TL;DR

- **Daily JS work** = Metro, free, any computer on same WiFi as phone.
- **Native rebuild at home** = local Mac build, free.
- **Native rebuild at work** = EAS cloud build, costs a credit.
- **Update TestFlight** = always EAS cloud build + submit, costs a credit. Local builds never reach TestFlight.
- **Phone plugged in** = essentially never (except first-time Xcode pairing).