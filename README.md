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

## Supabase deployment steps

The app and dashboard are configured for the requested project reference `axfiugfdbjyhulizbxhi`. The current signed-in Supabase browser account does not have permission to open that project, so no database changes or function deployments have been made there from this session.

Before Milestone 2 can be used against the live backend, the project owner must apply `mobile-app/supabase/migrations/20261110190000_milestone_2_community.sql` in the target project’s SQL Editor. Then:

1. Create/sign in to the intended TopTini admin Auth user and grant that exact email `is_admin` using `admin-access-setup.sql`.
2. Deploy `mobile-app/supabase/functions/delete-account/index.ts` as the `delete-account` Edge Function and `mobile-app/supabase/functions/admin-users/index.ts` as the `admin-users` Edge Function, with JWT verification enabled for both.
3. Confirm Email and Apple Auth settings and redirect URLs for the actual app bundle ID.

The Edge Function reads the service-role/secret key only from Supabase’s server-side environment. Never copy that secret into the mobile app or admin panel.

## Venue data

The existing `Venue 1`–`Venue 6`/`Venue 1`–`Venue 2` rows are demo placeholders, not real venue recommendations. The admin panel can import `mobile-app/venues_8_template.csv`. Replace placeholder details with the client’s verified venue list, current menu/source URLs, and exact map coordinates before public launch. Member suggestions remain private until an administrator checks for duplicates, confirms the drink, verifies the map pin, and approves them.
