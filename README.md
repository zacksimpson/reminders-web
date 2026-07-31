# Reminders Web

A desktop companion for the [Reminders tool](https://github.com/zacksimpson/reminders-tool) for the Light Phone III. Laid out as a responsive web app with feature parity and optional phone sync support.

![Reminders screenshots](public/reminders-web.png)

To get started, create an account here: https://reminders-tool.web.app

## Features
* Lists, tasks, and subtasks with due dates and recurring tasks
* Full feature parity with Reminders for LPIII
* Automatic account-based syncing
* Browser-based notifications for tasks
* Keyboard shortcuts for fast navigation
* Manually import a backup from the phone tool

_Pro tip: you can add this website to your dock/taskbar and it works great as a standalone "desktop app", complete with notifications, an icon, and everything!_

## Connecting your phone

Requires the [latest version](https://github.com/zacksimpson/reminders-tool/releases) of Reminders for the LPIII.

1. Create an account on the website.
2. On your Light Phone III, open Reminders, go to Settings → Account, and sign in with the same account you just created.
3. You're done! Tasks will automatically sync every few minutes.




## Building from Source + Running it yourself

The idea for this project is to optionally be a bring-your-own-backend platform, so each person who runs it can use their own Firebase project. (This can be done completely for free!) That way your usage never touches anyone else's quota (and vice versa), if you wish. 

<details>
  <summary>Building your backend</summary>

## Stack

- React + TypeScript + Vite
- Firebase (Auth + Firestore)

## Steps
1. Install [Node.js](https://nodejs.org) (pick the LTS version), which comes bundled with npm. Everything below runs through your terminal using npm.

2. Install the Firebase CLI and sign in:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. Create a Firebase project (Spark/free plan is enough), then point this checkout at it:

   ```bash
   firebase projects:create
   firebase use --add
   ```

   `firebase use --add` lists your projects, pick the one you just created and give it any alias (e.g. `default`). This just updates a local config file (`.firebaserc`) to point at your project instead of mine, no need to worry about it further.

4. Enable **Authentication → Email/Password** in the [Firebase console](https://console.firebase.google.com): open your project, then on the left click **Security → Authentication → Get started → Sign-in method → Email/Password → Enable**.

5. Enable Firestore, then deploy this repo's already-written security rules (each user can only read/write their own data, see [firestore.rules](firestore.rules)):

   In the console, on the left click **Databases & Storage → Firestore → Create database → Standard edition** (any location, production mode). Once it exists, deploy the rules with:

   ```bash
   firebase deploy --only firestore:rules
   ```

6. In the Firebase console, open **Project settings** (gear icon, top left) → **General** → scroll down to **Your apps** → **Add app** → click the web icon (`</>`) to register a new web app. It'll show you a `firebaseConfig` object, keep that tab open, you'll need its values in the next step.

7. Copy `.env.example` to `.env` (gitignored) and fill in the values, matching each `firebaseConfig` field from step 6 to its `VITE_FIREBASE_*` variable by name (e.g. `apiKey` → `VITE_FIREBASE_API_KEY`):

   ```bash
   cp .env.example .env
   ```

8. Install and run:

   ```bash
   npm install
   npm run dev
   ```

</details>

## Support

Reminders Web, as well as the rest of my LPIII tools, are developed in my free time. With this project in particular, I am also footing the server bill. If you've found any of it has been useful, I'd love to hear from you! Feel free to reach out [here](mailto:zacksimpson24@gmail.com). Another way to support is to [consider sponsoring](https://github.com/sponsors/zacksimpson). Either way, it means a lot!
