# Reminders Web

A standalone browser companion for [Reminders](https://github.com/zacksimpson/reminders-tool) for the Light Phone III. Laid out as a responsive desktop web app with feature parity, and syncs with the phone app.

## Connecting your phone

The phone app and this website share the same account and the same lists/tasks. On your Light Phone III, open Reminders, go to Settings → Account, and sign in with the same email and password you use here. See the in-app "Phone Sync" screen (Account tab) for details on how syncing behaves.

## Stack

- React + TypeScript + Vite
- Firebase (Auth + Firestore) on the free Spark plan

## Running it yourself

This repo doesn't ship with a working backend, so each person who runs it needs their own Firebase project. That way your usage never touches anyone else's quota (and vice versa).

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
5. Copy `.env.example` to `.env` and fill in those values:

   ```bash
   cp .env.example .env
   ```

6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

`.env` is gitignored, so your Firebase config stays local to your machine.
