# Ten Frames — School Edition

A second, **paid-up-front** binary of the same app, sold to institutions
through Apple School Manager (and managed Android). Everything unlocked from
first launch; no upgrade screen, no daily limit, no parental gate, no IAP.

## Why it exists

App Store Connect Analytics, May–Aug 2026: **160 of 189 first-time downloads
came from `Institutional Purchase`** — three separate bulk deployments (two
Irish, ~23 Jun and ~14 Jul; one US, ~24 Aug). App Store Search contributed 21
and Browse 5.

Institutions buy through Apple School Manager, which purchases **app licences**,
not in-app purchases. There is no way for a school to buy the €4.99 unlock: on a
managed classroom device there is no parent, no personal Apple ID, and MDM
policy usually disables in-app purchases outright. So every one of those 160
devices sits on the free tier — 5 problems/day on addition, subtraction and
puzzle, three levels per Adventure world.

The app found its market and the market has no way to pay. A priced binary is
the only mechanism Apple School Manager can actually buy.

> **Verify before investing.** That ASM cannot volume-purchase in-app purchases
> is a deduction from how the volume-purchase machinery is documented (it is
> built around app price — e.g. the 50%-off education discount applies to the
> app's price, and there is no IAP equivalent). No Apple page states it in so
> many words. Confirm with Apple Developer Support; the whole rationale rests
> on it.

## Is a second app allowed?

Guideline 4.3(a) says *"Don't create multiple Bundle IDs of the same app …
consider submitting a single app and providing the variations using in-app
purchase"* — which is exactly the mechanism that does not work here.

In practice App Review has accepted this pattern for years. Live examples,
each a paid School Edition alongside a free consumer app from the same
developer: Quick Math Jr. – School Edition ($8.99), Puppet Pals 2: School
Edition ($6.99), Slice Fractions School Edition ($3.99), My PlayHome School
($2.99), Space Pig Math: School Edition ($2.99).

What makes them acceptable is that they are a **different distribution
profile**, not a search-spam variant: everything unlocked, no IAP, no
purchase UI, bought in volume. Say that plainly in the App Review notes.

**Public, not Custom App.** A public School Edition appears in the Apps and
Books catalogue inside Apple School Manager — the very channel that found this
app three times unprompted. A Custom App is private and undiscoverable: you
must name each organisation by Organization ID, which is only useful for a
direct contract you already have.

## How the switch works

One flag, `IS_SCHOOL_EDITION` in `src/config/edition.ts`, read once at module
scope from `globalThis.__SCHOOL_EDITION__`.

Only `index.school.js` sets that global, and it does so with `require('./index')`
rather than an ESM import — imports are hoisted, which would evaluate the app
before the flag was set.

**The edition is chosen by which entry file the build bundles.** Nothing is
toggled by hand, so a consumer binary cannot accidentally ship as school, and
nothing needs reverting after a release.

Verified: `index.js` and `index.school.js` produce byte-different bundles
(2,800,878 vs 2,801,165 bytes).

### What the flag changes

| | Consumer | School |
|---|---|---|
| `usePremium.isPremium` | from storage, default false | always `true` |
| `loadPremiumData` | applies stored value | ignored — stored `isPremium:false` can never demote a school device |
| Daily limit | 5/day on addition, subtraction, puzzle | none (`isModeLimited` returns false when premium) |
| Adventure worlds | 3 free levels each | all levels |
| Settings → premium row | shown | hidden |
| Upgrade screen / parental gate | reachable | unreachable — every entry point is already behind `!isPremium` |

The upgrade entry points needed no edition checks: the 👑 header button
(`GameShell.tsx:346`), the locked-level bounce (`:859`) and the Parent
Dashboard paywall are all already gated on `!premium.isPremium`, which is
permanently false here. Only the Settings row was unconditional.

## iOS build

`react-native-xcode.sh` honours the `ENTRY_FILE` build setting, so switching
the JS bundle needs **no changes to the Xcode project**:

```sh
xcodebuild -workspace ios/TenFrames.xcworkspace -scheme TenFrames \
  -configuration Release -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO ENTRY_FILE=index.school.js build
```

**Do not add `PRODUCT_BUNDLE_IDENTIFIER` or `PRODUCT_NAME` to that command.**
A build setting passed on the `xcodebuild` command line applies to *every
target in the build, including every Pod*. Overriding `PRODUCT_NAME` renames
the pod libraries too, and the link fails with `ld: library 'AsyncStorage' not
found`. Learned the hard way — the first School Edition build died exactly
there.

So the command line is fine for **verifying** the edition, but the real
release must set the bundle identifier per-target. Add a scheme (5 minutes, no
risk of corrupting the project file):

1. **Product → Scheme → New Scheme**, name it `TenFrames School`.
2. **Project → Info → Configurations**, duplicate `Release` as `Release-School`.
3. Select that configuration in the new scheme's Run/Archive actions.
4. In the **target's** Build Settings, for `Release-School` only:
   - `PRODUCT_BUNDLE_IDENTIFIER` = `com.tenframes.school`
   - `ENTRY_FILE` = `index.school.js`
   - `INFOPLIST_KEY_CFBundleDisplayName` = `Ten Frames School`

Then create the App Store Connect record for `com.tenframes.school`, set a
price, and tick **Pricing and Availability → "Offer a reduced price on Apple
School Manager for volume purchases"** (50% off at 20+ licences). One source
says this can only be set *before* the app is approved — set it on the first
submission.

## Android build

**Not written, and deliberately not guessed at.** There is no JDK or Android
SDK on the Mac this was developed on, so any Gradle here would be untested.

The shape it needs:

- A `productFlavors` block on a new `edition` dimension (`consumer`, `school`),
  with `applicationId "com.tenframes.school"` on the school flavor. Note
  `defaultConfig` already carries `missingDimensionStrategy 'store', 'play'`
  for react-native-iap — a new dimension must not disturb it.
- The entry file. The React Native Gradle plugin's `react { entryFile = … }`
  is evaluated once, globally, not per variant, so the flavor cannot set it
  directly. Simplest reliable option is a Gradle property with a default:

  ```gradle
  react {
      entryFile = file(project.findProperty("tenframesEntry") ?: "../../index.js")
  }
  ```

  built with `-PtenframesEntry=../../index.school.js`. Verify the resulting APK
  actually contains the school bundle before shipping — the failure mode is a
  school-branded APK carrying consumer JS, which is silent and would ship a
  paid app that still shows a paywall.

## What has been verified

- `index.js` and `index.school.js` produce byte-different bundles.
- Four unit tests pin the flag: absent global → consumer; `true` → school;
  anything else (`1`, `'true'`, `{}`, `null`) → consumer; and a late flip does
  not change an already-loaded module.
- A School Edition binary built and ran on the simulator, and **wrote
  `{"isPremium":true,…}` to AsyncStorage** on the same device where the
  consumer build had previously written `isPremium:false`. Same bundle ID,
  same storage — only the entry file differed. That is runtime proof the flag
  reaches `usePremium`, which is what disables the daily limit and makes every
  `!isPremium`-gated upgrade entry point unreachable.
- 35 tests pass; eslint byte-identical to baseline.

Not verified: the Settings screen with the premium row hidden was never
photographed — simulator input automation would not reliably drive the taps.
It is a plain `{!IS_SCHOOL_EDITION && (…)}` conditional and the flag is proven
true at runtime, but nobody has looked at it.

## Store listing

Write the School Edition listing for the **IT administrator**, not the parent:
no accounts, no data leaves the device, works offline, no ads, no in-app
purchases, ready for managed deployment. `PrivacyInfo.xcprivacy` already ships
and the app collects nothing — that is a genuine selling point to this buyer
and worth stating explicitly.

The consumer listing is still English-only despite shipping full Romanian and
German narration. Fix that on both records.
