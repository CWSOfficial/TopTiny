# TopTiny project folder

The mobile app’s product name is **TopTini**. This project folder contains its React Native CLI source and a separate private admin dashboard.

## Contents

- `mobile-app/` — iOS and Android app, written in JSX/JavaScript, with reusable components, screens, navigation, and Supabase client.
- `admin-panel/` — private browser dashboard for venue/city management, submissions, review moderation, and reports.
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

The mobile app and dashboard point to the TopTini Supabase project `rpjiwpzoolraimwgfujr`. The live project has the app schema, four city guides, 12 clearly marked demo venues, community rating/submission/favorite/report tables, score and leaderboard views, and profile/review/venue photo buckets. The `admin-users` and `delete-account` Edge Functions are deployed. Client code contains only the publishable key; never add a service-role or secret key to app/admin source.

## Remaining account and release setup

The requested `admin@yopmail.com` Auth user is not present in the new project yet. Sign it up in the app first, confirm the email if prompted, then run `admin-access-setup.sql` as project owner to enable the admin dashboard for that account. The admin panel requires this `is_admin` profile flag.

Supabase Apple Auth is enabled for the native bundle ID `com.toptini.app`. The app uses Apple's native iOS authentication and exchanges the identity token with Supabase. A real Apple login still needs to be completed with the account holder's Apple ID on a signed iOS device/simulator.

Email/password signups currently require email confirmation. Configure a production SMTP provider in Supabase Auth before opening signup to general users; do not disable email verification as a substitute. The public support email is still a placeholder in the marketing/legal copy and needs the owner's chosen contact address.

The admin panel's local production build succeeds. Deploying the updated Supabase config to Vercel was blocked by Vercel CLI authorization in the current session. Redeploy from the authorized Vercel account before giving testers the production admin URL. The iOS simulator build is being run from Xcode; TestFlight must be uploaded only after the final signed build is accepted.

The Edge Function reads the service-role/secret key only from Supabase’s server-side environment. Never copy that secret into the mobile app or admin panel.

## Venue data

The existing `Venue 1`–`Venue 6`/`Venue 1`–`Venue 2` rows are demo placeholders, not real venue recommendations. The admin panel can import `mobile-app/venues_8_template.csv`. Replace placeholder details with the client’s verified venue list, current menu/source URLs, and exact map coordinates before public launch. Member suggestions remain private until an administrator checks for duplicates, confirms the drink, verifies the map pin, and approves them.
