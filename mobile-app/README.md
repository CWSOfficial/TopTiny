# TopTini

TopTini is a React Native CLI application built in JavaScript and JSX, backed by Supabase Auth, Postgres, and Storage. Milestone 1 includes email and Apple sign-in flows, venue data, city search, map/list discovery, venue details, editable profiles, and profile-photo upload. Milestone 2 adds decimal venue ratings, photo reviews, favorites, venue score summaries, city leaderboards, venue suggestions with duplicate prevention, admin approval/moderation, and account deletion.

## App source

- `App.jsx` — app entry and startup/offline splash gate.
- `src/screens/` — each screen and its own `.styles.js` file.
- `src/components/` — reusable JSX components and separate style files.
- `src/context/` — connectivity, city, venue, and profile state.
- `src/navigation/` — native stack and bottom-tab navigation.
- `src/assets/images/`, `src/assets/icons/` — app media and icon asset locations.
- `src/styles/theme.js` — palette, spacing, and corner-radius tokens.

There are no `.ts` or `.tsx` source files.

## Local setup

1. Install Node.js 20.19 or later, Android Studio and/or Xcode, and the React Native CLI prerequisites for your host OS.
2. Run `npm install` in this directory.
3. The app is configured for project reference `axfiugfdbjyhulizbxhi`. The Milestone 2 migration is present at `supabase/migrations/20261110190000_milestone_2_community.sql`; the current signed-in dashboard account could not access this project, so database deployment still needs the project owner.
4. `src/config.js` is configured with the project URL and **publishable key**. Never place a service-role or secret key in the app.
5. Confirm Email and Apple providers, confirmation templates, and allowed redirects in the target project's Auth settings. The bundle identifier in the iOS project is `com.toptini.app`.
6. The app's seed data defines 12 clearly marked demo listings: Venue 1–6 in Milwaukee, and Venue 1–2 in Chicago, Phoenix, and Austin. Replace these with client-approved, verified venue data before public launch.
7. For iOS, install native dependencies with `cd ios && pod install && cd ..` after installing or changing JavaScript packages.
8. Run `npm run android` or `npm run ios`.

The native CLI Android and iOS project shells are included. Android Maps needs a Google Maps key supplied locally in `android/gradle.properties` as `MAPS_API_KEY=...`; do not commit that key. iOS Apple authentication needs the `com.toptini.app` App ID registered with Sign in with Apple under the correct Apple Developer team. The mobile app connects directly to Supabase.

## Release configuration to verify

- The app includes 12 clearly marked demo placeholders. Replace them with the client’s real venue records before public launch; do not present placeholder addresses as real locations.
- Confirm production email delivery, confirmation templates, allowed redirect URLs, and Apple provider settings in the requested Supabase project after access is available.
- An earlier TestFlight upload was reported in the project conversation. The current App Store Connect processing/availability status and whether the latest M2 build has been signed are not verified by this source folder.
- Configure the Android Maps key locally. The iOS bundle identifier is `com.toptini.app` and must match the Apple Developer App ID and Supabase Apple provider configuration.

## API

Supabase Auth owns password and Apple identity authentication. Supabase Postgres stores profiles, venues, and community activity. The client app uses only the public publishable key; RLS is the database security boundary. The current account could not access the target project, so its provider configuration, signing and current distribution status still need owner-side verification.

Supabase is the app backend. A legacy Express/SQLite directory may exist outside this project folder; it is not called by this app.

## Milestone 2 deployment status

The mobile and admin code for Milestone 2 is implemented, but it is not live until the target database migration and account-deletion Edge Function are deployed. See the parent `TopTiny/README.md` for the owner-only deployment steps and remaining client inputs.
