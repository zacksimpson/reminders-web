# Reminders - Web

A standalone browser companion for [Reminders](https://github.com/zacksimpson/reminders-tool), the Light Phone III reminders app. Laid out as a resizable multi-pane desktop app instead of the phone's tab bar.

This is **not** currently synced with the phone app, it's a separate Firebase-backed account, with its own sign-in and its own tasks. Phone sync is a possible future phase, not implemented yet.

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
