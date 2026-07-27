# Reminders Web

A standalone browser companion for the [Reminders tool](https://github.com/zacksimpson/reminders-tool) for the Light Phone III. Laid out as a responsive desktop web app with feature parity and phone sync support.

> [!WARNING]
> This web app is under development. Feel free to create an account, check it out, and contribute by opening an issue or submitting a PR!

Check out Reminders Web here: https://reminders-tool.web.app


## Connecting your phone

Phone syncing requires the [prerelease version]([url](https://github.com/zacksimpson/reminders-tool/releases/tag/v2.0.0-beta.1)) of Reminders for the LPIII. The phone app and this website share the same account and the same lists/tasks. On your Light Phone III, open Reminders, go to Settings → Account, and sign in with the same email and password you use here. See the in-app "Phone Sync" screen (Account tab) for details on how syncing behaves.


## Stack

- React + TypeScript + Vite
- Firebase (Auth + Firestore) on the free Spark plan

## Running it yourself

The idea for this project is to eventually be a bring-your-own-backend, so each person who runs it needs their own Firebase project. (This can be done completely for free!) That way your usage never touches anyone else's quota (and vice versa). 
<details>
  <summary>Building your backend</summary>
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) (Spark/free plan is enough).
2. Enable **Authentication → Email/Password**.
3. Enable **Firestore**, and set rules so each user can only read/write their own data:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

4. In the Firebase console, add a Web App to your project and copy its config values.
5. Copy `.env.example` to `.env` (gitignored) and fill in those values:

   ```bash
   cp .env.example .env
   ```

6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

</details>

## Support

Reminders Web, as well as the rest of my LPIII tools, are developed in my free time. If you've found any of it has been useful, I'd love to hear from you! Feel free to reach out [here](mailto:zacksimpson24@gmail.com). Another way to support is to [consider sponsoring](https://github.com/sponsors/zacksimpson). Either way, it means a lot!
