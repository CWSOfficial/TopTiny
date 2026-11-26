# TopTini — Handover Status

Updated 26 November 2026. This note records the verified state of the source tree and the remaining steps for an independent client handover.

## 1. Source code and assets

- The React Native CLI app is in `mobile-app/`; it uses JSX/JavaScript, separate screen style files, reusable components, native iOS/Android projects, and the TopTini logo and image assets.
- The React/Vite admin panel is in `admin-panel/`.
- The repository remote is `https://github.com/CWSOfficial/TopTiny.git`. It is public, but it is still owned by the CWSOfficial GitHub organization; repository ownership has not been transferred to the client.
- No service-role or other Supabase server secret belongs in either frontend. The app/admin source must use only the publishable key.

## 2. Backend connection and ownership

- Both app and admin source currently reference `rpjiwpzoolraimwgfujr` in `mobile-app/src/config.js` and `admin-panel/config.js`.
- The client specified Supabase project `axfiugfdbjyhulizbxhi`. The current signed-in Supabase account cannot open that project, and its publishable key and project settings could not be read. The code therefore has not been switched to the client project.
- Before handover, the client must grant the current developer account the access needed to configure and deploy the app in `axfiugfdbjyhulizbxhi`, then the project owner should own the organization/project and billing. Confirm Auth providers and email delivery, database migrations, storage buckets, RLS, and Edge Functions in that project.
- The database and service configuration are not portable merely by changing the URL. Apply and verify the migrations/functions in the client-owned project before release.

## 3. Client-requested app updates in this working copy

- Removed “Welcome Back” from the login screen.
- Guest navigation is available for discovery; sign-in remains available for account actions.
- Venue cards show the TopTini score and a “Rate It” action. The map callout includes the score and “Rate It” action.
- Venue details include a branded per-venue share image and the iOS share sheet.
- iOS location purpose text and the app privacy manifest were updated to describe actual app data and location use.

## 4. Build and TestFlight

- Version 1.0, build 7 compiles and runs on the iPhone Air simulator. The card score, rating shortcut and generated share image were observed in the running app.
- App Store Connect currently shows build 6 (1.0) as “Ready to Submit”. Build 7 has not been archived or uploaded.
- An external TestFlight group, “TopTini Client Testers”, exists but has no build or testers yet. Apple requires beta review information before an external build can be submitted for review.
- The account-level user list shows the client’s Developer invitation and the tester address’s App Manager invitation still pending. These are App Store Connect team invitations; they do not by themselves add an external TestFlight tester. The App Manager role for a tester is broader than tester-only access and should be reviewed by the account holder.

## 5. Apple review items still needing owner input or implementation

- Provide an approved public support email, a review contact name, and phone number. The existing website/privacy copy still contains a support placeholder. Do not publish the client's access-request email as a support address without approval.
- Add the client-provided Apple ID email to the external TestFlight group after a current build is uploaded and Apple’s beta review contact details are complete.
- Complete the App Store Connect privacy nutrition labels and metadata so they match the actual app, privacy policy, backend, and SDKs. The privacy manifest is only one part of Apple's privacy requirements.
- The app already supports review reporting and administrator moderation, but user blocking and automated objectionable-content filtering have not been verified as implemented. Complete and verify those UGC moderation controls before claiming Apple Guideline 1.2 readiness.
- Verify the client-owned Supabase Apple/email providers, account deletion, live service availability, privacy policy URL, and app review access after the client backend is available. No software can guarantee App Store approval.

## 6. Ownership and handover steps

1. Transfer the GitHub repository to a client-owned GitHub account/organization, or have the client name the GitHub account to add and accept repository access. Repository ownership is not transferred yet.
2. Move/establish Supabase under the client’s organization and give the client owner access. Remove developer-owned billing and credentials from the production path.
3. Ensure the app record and signing assets are under the client’s Apple Developer account. The current App Store Connect invitations are pending; account ownership and app transfer have not been completed.
4. Store production secrets only in the client-owned provider dashboards and document safe rotation. Never send passwords, service-role keys, or Apple private keys in chat or commit them.
5. Provide the final client-owned repository, verified backend project, release archive/build instructions, App Store Connect/TestFlight access, and this handover note once those transfers are complete.

## Inputs needed to finish the blocked release steps

- Access to the client Supabase project `axfiugfdbjyhulizbxhi` for the current developer account, or a client-owned development account with equivalent project access.
- The client’s GitHub username/organization for the source ownership transfer.
- Approved public support/review contact email, contact name, and review phone number.
- Acceptance of the pending App Store Connect invitations by their recipients.
