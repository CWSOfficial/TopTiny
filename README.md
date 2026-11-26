# TopTiny project folder

The mobile app’s product name is **TopTini**. This project folder contains its React Native CLI source and a separate authenticated admin dashboard.

## Contents

- `mobile-app/` — iOS and Android app, written in JSX/JavaScript, with reusable components, screens, navigation, and Supabase client.
- `admin-panel/` — authenticated browser dashboard for venue/city management, submissions, review moderation, and reports. Its source is in the public repository; Supabase RLS restricts admin data operations.
- `admin-access-setup.sql` — owner-run SQL to grant the first app administrator after replacing the email placeholder.

## Run the mobile app

```sh
cd mobile-app
npm install
cd ios && pod install && cd ..
npm run ios
```

## Run the React admin panel locally

```sh
cd admin-panel
npm install
npm run dev
```

Then open `http://localhost:4173/`. The dashboard is built with React JSX and Vite, and uses Supabase browser sign-in with a publishable key. PostgreSQL RLS enforces admin permissions; never add a service-role or secret key to frontend code.

## Supabase status

The app and dashboard source currently point to the earlier Supabase project `rpjiwpzoolraimwgfujr`. The client specified `axfiugfdbjyhulizbxhi` as the project to use, but the current signed-in Supabase account has no access to that project, so the app has not yet been switched. The source contains only a publishable key; never add a service-role or secret key to app/admin code. See [HANDOVER.md](HANDOVER.md) for the verified current state and remaining owner actions.

## Remaining account and release setup

The admin account and Edge Function deployment must be checked again in the client-owned Supabase project after access is granted. Do not treat the earlier project's admin credentials or role as portable.

The app uses Apple's native iOS authentication and exchanges the identity token with Supabase. Apple provider settings must be verified in the client-owned Supabase project for bundle ID `com.toptini.app` before release.

Email/password signups currently require email confirmation. Configure a production SMTP provider in Supabase Auth before opening signup to general users; do not disable email verification as a substitute. The public support email is still a placeholder in the marketing/legal copy and needs the owner's chosen contact address.

The iOS debug build (version 1.0, build 7) compiles and runs on the iPhone Air simulator. It is not a release archive and has not been uploaded. Do not publish it until its backend points to the client-owned project and the Apple submission items in `HANDOVER.md` are resolved.

The Edge Function reads the service-role/secret key only from Supabase’s server-side environment. Never copy that secret into the mobile app or admin panel.

## Venue data

The existing `Venue 1`–`Venue 6`/`Venue 1`–`Venue 2` rows are demo placeholders, not real venue recommendations. The admin panel can import `mobile-app/venues_8_template.csv`. Replace placeholder details with the client’s verified venue list, current menu/source URLs, and exact map coordinates before public launch. Member suggestions remain private until an administrator checks for duplicates, confirms the drink, verifies the map pin, and approves them.
