# Conversa — MERN Real-Time Chat Application

<div align="center">

[![CI](https://github.com/elus444/conversa/actions/workflows/ci.yml/badge.svg)](https://github.com/elus444/conversa/actions/workflows/ci.yml)
![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248.svg?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-%23000000.svg?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React%2019-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/Node.js-%23339933.svg?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-%23000000.svg?style=flat&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-%2306B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=flat&logo=cloudflare&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)

A full-stack, production-grade real-time chat application built with the MERN stack and Socket.IO. Features include one-on-one messaging, a personalised AI chatbot powered by Google Gemini, image sharing via Cloudflare R2, email verification, email notifications, and a fully responsive dark/light UI built with React 19, TypeScript, Tailwind CSS v4, and shadcn/ui components.

### 🔗 [**Live Demo**](https://conversa-elham.pages.dev) — no signup needed, click **"Try as guest"**

[![Conversa screenshot](screenshots/banner.png)](https://conversa-elham.pages.dev)

**Deployed entirely on free tiers** — Cloudflare Pages (frontend) + Render (backend) + MongoDB Atlas + Cloudflare R2 (storage) + Resend (email) + Google AI Studio (Gemini). $0/month.

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Data Models](#data-models)
- [REST API Reference](#rest-api-reference)
- [Socket.IO Events](#socketio-events)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Docker (recommended)](#docker-recommended)
  - [Manual (local development)](#manual-local-development)
- [Production Deployment](#production-deployment)
- [Scripts](#scripts)
- [Testing & CI](#testing--ci)
- [Security Design](#security-design)
- [Roadmap](#roadmap)
- [Background Jobs](#background-jobs)
- [License](#license)

---

## Features

### Authentication & Email Verification
- **Register / Login** with email and password (bcrypt hashed, JWT issued with 7-day expiry)
- **OTP Login** — request a one-time password sent via Resend; time-limited (5 min), bcrypt-stored
- **Email verification** — after registration (or on first login for existing accounts), users must verify their email with a 6-digit OTP before accessing the dashboard; unverified users are always redirected to `/verify-email`
- **Persistent sessions** — JWT stored in `localStorage`; `auth-token` header used on every API call
- **Guest demo account** — "Try as guest" on the landing page logs straight into a pre-seeded, pre-verified account with populated conversations, so evaluating the app doesn't require signing up or waiting on an email
- **Account deletion** — soft-anonymises the account (clears name, email, bio, credentials) while preserving conversation history for other participants

### Profile Management
- Update name, about text, and profile picture
- Change password (old password verification required)
- Profile pictures uploaded directly from the browser to Cloudflare R2 via pre-signed POST URLs (max 5 MB, images only); removal resets to a generated ui-avatars.com URL

### Messaging
- **Real-time one-on-one chat** over Socket.IO
- **Text and image messages** — images uploaded to Cloudflare R2 with optional caption text
- **Rich text formatting** — markdown (bold, italics, links, lists, inline code, code blocks via `react-markdown` + `remark-gfm`) renders in every text message, not just AI replies
- **Message pagination** — 50 messages per page, older ones load on scroll-to-top (`hasMore`-driven infinite scroll), backed by a compound `{conversationId, createdAt}` index so it stays fast regardless of history length
- **Edit messages** — sender-only, text-only, over the socket (`edit-message` → `message-edited`); no edit history is kept, just an `editedAt` flag and an "edited" label
- **Reactions** — one emoji per user per message; reacting again with the same emoji removes it, a different one replaces it (`react-message` → `message-reaction`)
- **Full-text search** — `GET /message/search`, backed by a MongoDB text index on `Message.text`; scoped to one conversation or across every conversation the user is in
- **Reply to message** — `replyTo` reference stored per message; displayed as quoted context in the UI
- **Delete for me** — hard-removes a message from your view only (appended to `hiddenFrom`)
- **Delete for everyone** — soft-delete sets `softDeleted: true`; message shows as *"This message was deleted"* tombstone for all members
- **Bulk hide** — hide multiple selected messages at once for yourself
- **Clear chat** — hide the entire conversation history from your view with a single action
- **Star / unstar messages** — bookmark individual messages; view all starred messages in a dedicated page
- **Seen receipts** — `seenBy` array tracks who read each message and when
- **Unread counts** — per-user counters maintained on the `Conversation` document, reset on room join
- **Latest message preview** — `latestmessage` field keeps the chat list up to date in real time
- **Optimistic UI** — edits and reactions update the local view immediately on the actor's own screen rather than waiting on a round-trip; the socket broadcast is what syncs the other participant

### AI Chatbot
- Every user gets a **personal AI Chatbot** conversation created automatically at registration
- Powered by **Google Gemini** (via `@google/genai`) with configurable model
- **Streaming responses** — bot replies are streamed chunk-by-chunk over Socket.IO (`bot-chunk`, `bot-done`) so text appears progressively
- **Context-aware** — last 19 text messages sent as chat history on every request, giving the bot memory of the conversation
- **Typing indicator** — bot emits `typing` / `stop-typing` while generating
- **Rollback on error** — if the Gemini stream fails, the user message is deleted and `bot-error` is emitted

### Email Notifications
- When a message is received and the recipient is **completely offline** (no open sockets), a branded HTML email is sent with a message preview and a deep-link back to the conversation
- **Fire-and-forget** — the email is never awaited in the socket path, adding zero latency to message delivery
- Users can **toggle email notifications** on/off from the Settings page (`/user/profile`); preference is persisted to the database

### Real-Time Presence & Notifications
- **Online / Offline status** — `isOnline` flag updated on socket connect/disconnect; broadcast to all conversation partners
- **Last seen** — timestamp recorded on disconnect, served via API
- **Multi-device / multi-tab aware** — `Map<userId, Set<socketId>>` tracks all open sockets; user is only marked offline when their *last* socket closes
- **Stale online cleanup** — background cron job runs every hour to force-offline users whose socket disconnect was missed (e.g. server crash)
- **Typing indicators** — `typing` / `stop-typing` events broadcast to the conversation room *and* to the receiver's personal room if they are online but not viewing that chat
- **In-app push notification** — `new-message-notification` event sent to the receiver's personal room when they are not inside the active conversation

### Conversation Management
- **Start a conversation** — search for any registered user; reuses an existing conversation if one already exists
- **Conversations list** — sorted by `updatedAt` descending; pinned conversations always appear at the top
- **Pin / unpin conversations** — per-user; stored as `pinnedConversations` array on the User document
- **Block / unblock users** — `blockedUsers` array on the User document
  - Blocked users cannot send messages (checked server-side before every `send-message` socket event)
  - Blocked users see sanitised profile information (generic name, avatar, and offline status)
- **User discovery** — paginated, searchable, and sortable list of users with whom you have no existing conversation

### UI & UX
- **React 19** with full **TypeScript** type safety
- **Tailwind CSS v4** with **shadcn/ui** component library
- **Dark / Light / System** theme toggle powered by `next-themes`
- Fully **responsive** — optimised for both desktop and mobile
- **React Router v7** nested route layout system (`DashboardLayout` → `ConversationLayout`)
- **Sonner** toast notifications
- **Markdown rendering** in bot messages via `react-markdown` + `remark-gfm`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui, React Router v7 |
| **Backend** | Node.js, Express.js 4 |
| **Database** | MongoDB (Mongoose 8) |
| **Real-time** | Socket.IO 4 (server + client) |
| **Authentication** | JSON Web Tokens (jsonwebtoken), bcryptjs |
| **AI** | Google Gemini via `@google/genai` |
| **File Storage** | Cloudflare R2 (pre-signed POST uploads) |
| **Email** | Resend — OTP login, email verification, message notifications |
| **Containerisation** | Docker, Docker Compose |

---

## Project Structure

```
conversa/
├── docker-compose.yml                 # Orchestrates mongo + backend + frontend
├── .env.example                       # Template for all environment variables
│
├── backend/
│   ├── Dockerfile
│   ├── index.js                       # Server bootstrap: HTTP server, Socket.IO init, DB connect, listen
│   ├── app.js                         # Express app + middleware/routes only (no side effects — testable)
│   ├── db.js                          # MongoDB connection
│   ├── secrets.js                     # Environment variable exports
│   ├── __tests__/                     # Jest + Supertest (see Testing & CI)
│   ├── Controllers/
│   │   ├── auth-controller.js         # register, login, OTP login, authUser,
│   │   │                              #   sendVerificationOtp, verifyEmail
│   │   ├── conversation-controller.js # create, list, get, togglePin
│   │   ├── message-controller.js      # allMessage, delete, bulkHide, star, clear, AI streaming
│   │   └── user-controller.js         # updateProfile, block, R2 presign, user search,
│   │                                  #   deleteAccount, getBlockStatus
│   ├── Models/
│   │   ├── User.js                    # Full user schema (see Data Models)
│   │   ├── Conversation.js            # members, latestmessage, unreadCounts
│   │   └── Message.js                 # seenBy, hiddenFrom, softDeleted, starredBy, replyTo
│   ├── Routes/
│   │   ├── auth-routes.js
│   │   ├── conversation-routes.js
│   │   ├── message-routes.js
│   │   └── user-routes.js
│   ├── socket/
│   │   ├── index.js                   # Socket.IO setup, JWT auth middleware, userSocketMap
│   │   └── handlers.js                # All socket event handlers + email notification trigger
│   ├── middleware/
│   │   └── fetchUser.js               # JWT verification middleware for REST routes
│   ├── utils/
│   │   └── sendMessageEmail.js        # Fire-and-forget offline message email helper
│   ├── jobs/
│   │   └── staleOnlineUsers.js        # Hourly cleanup of stale isOnline flags
│   └── scripts/
│       ├── seed-test-users.js
│       ├── delete-test-users.js
│       └── seed-demo-account.js       # Permanent guest account + populated conversations
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf                     # SPA fallback + asset caching config
    └── src/
        ├── App.tsx                    # Route definitions
        ├── pages/
        │   ├── Home.tsx
        │   ├── Login.tsx              # Password + OTP login tabs
        │   ├── SignUp.tsx
        │   ├── VerifyEmail.tsx        # Post-login email verification gate
        │   ├── Conversations.tsx
        │   ├── ConversationDetail.tsx # Chat view with streaming bot support
        │   ├── StarredMessages.tsx
        │   ├── User.tsx               # Redirect helper
        │   └── UserProfile.tsx        # Profile, password, appearance, notification settings
        ├── components/
        │   ├── layout/
        │   │   ├── DashboardLayout.tsx  # Auth + email-verified guard
        │   │   ├── ConversationLayout.tsx
        │   │   └── DashboardSidebar.tsx
        │   ├── dashboard/             # Chat-specific components
        │   └── ui/                    # shadcn/ui component library
        ├── context/                   # AuthProvider, ChatProvider, ConversationsProvider
        ├── hooks/                     # use-auth, use-chat, use-conversations, use-socket
        └── lib/
            ├── api.ts                 # Centralised HTTP client
            └── socket.ts              # Socket.IO client setup
```

---

## Architecture Overview

```
Browser ──HTTP──▶  Express REST API  ──▶  MongoDB
        ──WS────▶  Socket.IO Server  ──▶  MongoDB
                                     ──▶  Resend (offline email notifications)

Socket.IO authentication
  Every socket connection presents a JWT in handshake.auth.token.
  The middleware verifies the token and attaches socket.userId.
  Handlers never trust any client-supplied user ID.

Per-user socket tracking
  userSocketMap: Map<userId, Set<socketId>>
  Tracks all open connections across multiple tabs and devices.
  A user is marked offline only when their last socket disconnects.

Email notification pipeline
  send-message event ──▶ receiver has no open sockets?
                      ──▶ receiver.emailNotificationsEnabled?
                      ──▶ sendMessageEmail() (fire-and-forget, no await)

AI streaming pipeline
  Browser ──send-message──▶  Server detects isBot member
          ◀──bot-chunk───── streams Gemini chunks via Socket.IO
          ◀──bot-done──────  final saved Message document
```

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `name` | String | 3–50 chars, required |
| `email` | String | unique, lowercase |
| `password` | String | bcrypt hashed |
| `about` | String | bio / status text |
| `profilePic` | String | URL; defaults to ui-avatars.com |
| `isOnline` | Boolean | updated on socket connect / disconnect |
| `lastSeen` | Date | set on disconnect |
| `isEmailVerified` | Boolean | `false` until OTP verification is completed |
| `emailNotificationsEnabled` | Boolean | controls offline email notifications; default `true` |
| `isBot` | Boolean | `true` for AI bot accounts |
| `otp` | String | bcrypt-hashed OTP (shared for login OTP and email verification) |
| `otpExpiry` | Date | OTP expiry timestamp |
| `blockedUsers` | [ObjectId → User] | users this user has blocked |
| `pinnedConversations` | [ObjectId → Conversation] | pinned conversation IDs |
| `isDeleted` | Boolean | soft-delete flag for anonymised accounts |

### Conversation

| Field | Type | Notes |
|---|---|---|
| `members` | [ObjectId → User] | participants (always exactly 2) |
| `latestmessage` | String | preview text for chat list |
| `unreadCounts` | [{userId, count}] | per-member unread counter |
| `timestamps` | auto | `createdAt`, `updatedAt` |

### Message

| Field | Type | Notes |
|---|---|---|
| `conversationId` | ObjectId → Conversation | required |
| `senderId` | ObjectId → User | required |
| `text` | String | required if no `imageUrl` |
| `imageUrl` | String | required if no `text`; R2 URL |
| `seenBy` | [{user, seenAt}] | read receipts |
| `hiddenFrom` | [ObjectId → User] | hard-deleted for these users |
| `softDeleted` | Boolean | `true` = "deleted" tombstone shown to all |
| `starredBy` | [ObjectId → User] | users who starred this message |
| `replyTo` | ObjectId → Message | quoted reply reference |
| `timestamps` | auto | `createdAt`, `updatedAt` |

---

## REST API Reference

All protected routes require the header `auth-token: <JWT>`.

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account + personal bot + initial conversation |
| `POST` | `/auth/login` | — | Login with password or OTP (`{ email, password }` or `{ email, otp }`) |
| `POST` | `/auth/getotp` | — | Send OTP to email for OTP-based login |
| `GET` | `/auth/me` | ✅ | Get authenticated user profile |
| `POST` | `/auth/send-verification-otp` | ✅ | Send a 10-min verification OTP to the logged-in user's email |
| `POST` | `/auth/verify-email` | ✅ | Verify email with OTP; sets `isEmailVerified: true` |

### Conversations — `/conversation`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/conversation` | ✅ | Create or retrieve a conversation |
| `GET` | `/conversation` | ✅ | List all conversations (pinned first, then by `updatedAt`) |
| `GET` | `/conversation/:id` | ✅ | Get a single conversation |
| `POST` | `/conversation/:id/pin` | ✅ | Toggle pin on a conversation |

### Messages — `/message`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/message/starred` | ✅ | Get all messages starred by the current user |
| `GET` | `/message/:id` | ✅ | Get all messages in a conversation (marks as seen) |
| `DELETE` | `/message/bulk/hide` | ✅ | Hide multiple messages for self (`body: { messageIds }`) |
| `DELETE` | `/message/:id` | ✅ | Delete a message (`body: { scope: "me" \| "everyone" }`) |
| `POST` | `/message/clear/:conversationId` | ✅ | Clear entire chat history for self |
| `POST` | `/message/:id/star` | ✅ | Toggle star on a message |

### Users — `/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| `PUT` | `/user/update` | ✅ | Update profile (name, about, profilePic, password, emailNotificationsEnabled) |
| `GET` | `/user/online-status/:id` | ✅ | Get online status of a user |
| `GET` | `/user/non-friends` | ✅ | Paginated, searchable, sortable user discovery |
| `GET` | `/user/presigned-url` | ✅ | Get R2 pre-signed POST URL for image upload |
| `POST` | `/user/block/:id` | ✅ | Block a user |
| `DELETE` | `/user/block/:id` | ✅ | Unblock a user |
| `GET` | `/user/block-status/:id` | ✅ | Get mutual block status between current user and target |
| `DELETE` | `/user/delete` | ✅ | Soft-delete / anonymise the authenticated user's account |

#### `GET /user/non-friends` Query Parameters

| Param | Default | Options |
|---|---|---|
| `search` | `""` | name or email substring |
| `sort` | `name_asc` | `name_asc`, `name_desc`, `last_seen_recent`, `last_seen_oldest` |
| `page` | `1` | integer ≥ 1 |
| `limit` | `20` | 1–50 |

---

## Socket.IO Events

The socket server requires a valid JWT passed in `handshake.auth.token`.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `setup` | — | Join personal room; mark user online; notify friends |
| `join-chat` | `{ roomId }` | Join a conversation room; reset unread count; mark all messages seen |
| `leave-chat` | `roomId` | Leave a conversation room |
| `send-message` | `{ conversationId, text?, imageUrl?, replyTo? }` | Send a message (or trigger AI bot response) |
| `delete-message` | `{ messageId, conversationId, scope }` | Delete a message (`scope: "me" \| "everyone"`) |
| `typing` | `{ conversationId, typer, receiverId }` | Broadcast typing indicator |
| `stop-typing` | `{ conversationId, typer, receiverId }` | Broadcast stop-typing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `user setup` | `userId` | Confirms setup complete |
| `user-joined-room` | `userId` | Another user entered the conversation room |
| `receive-message` | `Message` | New message delivered to room |
| `new-message-notification` | `{ message, sender, conversation }` | In-app push to receiver's personal room when not in the chat |
| `messages-seen` | `{ conversationId, seenBy, seenAt }` | Notifies sender their messages were read |
| `message-deleted` | `{ messageId, conversationId, softDeleted, latestmessage }` | Tombstone broadcast for scope="everyone"; sidebar preview updated |
| `message-blocked` | `{ conversationId }` | Message rejected due to a block |
| `typing` | `{ conversationId, typer, receiverId? }` | Forwarded typing indicator |
| `stop-typing` | `{ conversationId, typer, receiverId? }` | Forwarded stop-typing indicator |
| `user-online` | `{ userId }` | A contact came online |
| `user-offline` | `{ userId }` | A contact went offline |
| `bot-chunk` | `{ conversationId, tempId, chunk }` | Streamed AI response text chunk |
| `bot-done` | `{ conversationId, tempId, message }` | AI response complete; `message` is the saved document |
| `bot-error` | `{ conversationId, userMessageId? }` | AI response failed; provides rolled-back message ID |

---

## Environment Variables

A single `.env` file at the **project root** is used for both Docker Compose and local development. Copy `.env.example` to `.env` and fill in your values.

```env
# ── Database ──────────────────────────────────────────────────────────────────
# Overridden automatically by docker-compose to point at the mongo service.
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=conversa

# ── Auth ──────────────────────────────────────────────────────────────────────
JWT_SECRET=change_me_to_a_long_random_secret

# ── Google Gemini (AI bot) ────────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3-flash-preview

# ── Email (Resend) ────────────────────────────────────────────────────────────
# Used for: OTP login, email verification, offline message notifications
RESEND_API_KEY=your_resend_api_key

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGIN=*                      # restrict to your frontend origin in production

# ── Cloudflare R2 (profile picture uploads) ─────────────────────────────────────────
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_BUCKET_NAME=your_r2_bucket_name
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# ── App URL (used in email notification deep-links) ───────────────────────────
FRONTEND_URL=http://localhost:5173

# ── Frontend (Vite — baked into the JS bundle at build time) ─────────────────
# Must be the public URL where the backend is reachable FROM THE BROWSER.
VITE_API_URL=http://localhost:5500
```

---

## Getting Started

### Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin).

```bash
# 1. Clone the repo
git clone https://github.com/your-username/conversa.git
cd conversa

# 2. Create your .env from the template
cp .env.example .env
# Edit .env — set JWT_SECRET, GEMINI_API_KEY, RESEND_API_KEY, R2_*, etc.

# 3. Build and start all three services (mongo + backend + frontend)
docker compose up --build -d

# Frontend  →  http://localhost
# Backend   →  http://localhost:5500
# MongoDB   →  localhost:27019 (mapped away from the default 27017)
```

> **`VITE_API_URL`** must be the URL where the backend is reachable **from the user's browser**.  
> For local Docker this is `http://localhost:5500`. For production, use your public API domain.

### Manual (local development)

Requires Node.js ≥ 20 and a running MongoDB instance.

```bash
# Backend
cd backend
cp .env.example .env   # or edit backend/.env directly
npm install
npm run dev            # nodemon — listens on :5500

# Frontend (separate terminal)
cd frontend
# create frontend/src/.env with:  VITE_API_URL=http://localhost:5500
npm install
npm run dev            # Vite dev server — listens on :5173
```

---

## Production Deployment

The live demo runs on entirely free-tier infrastructure, spread across the providers each free tier suits best:

| Piece | Provider | Notes |
|---|---|---|
| Frontend | [Cloudflare Pages](https://pages.cloudflare.com/) | Static Vite build, deployed via `wrangler pages deploy` |
| Backend | [Render](https://render.com/) | Free web service, defined by [`render.yaml`](render.yaml) (Blueprint) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) | Free M0 shared cluster |
| File storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) | S3-API-compatible; presigned **PUT** uploads (R2 doesn't implement S3's presigned-POST) |
| Email | [Resend](https://resend.com/) | Render blocks outbound SMTP ports by default, so mail goes over Resend's HTTPS API instead of SMTP |
| AI | [Google AI Studio](https://aistudio.google.com/) | Gemini API, free tier |

Two things worth calling out for anyone repeating this setup:
- **R2 has no presigned-POST support** — `getPresignedUrl` signs a `PutObjectCommand` via `@aws-sdk/s3-request-presigner` instead of `@aws-sdk/s3-presigned-post`, and the frontend does a plain `fetch(url, { method: "PUT", body: file })` rather than building multipart form data.
- **The AWS SDK's newer default checksum behavior breaks R2** — `requestChecksumCalculation`/`responseChecksumValidation` must be set to `"WHEN_REQUIRED"` on the `S3Client`, or every request gets rejected.

## Scripts

### Backend (`backend/`)

| Script | Command | Description |
|---|---|---|
| `start` | `node index.js` | Start production server |
| `dev` | `nodemon index.js` | Start dev server with hot-reload |
| `test` | `jest --runInBand` | Run the backend test suite |
| `seed:users` | `node scripts/seed-test-users.js` | Seed a set of test users |
| `delete:users` | `node scripts/delete-test-users.js` | Remove seeded test users |
| `seed:demo` | `node scripts/seed-demo-account.js` | Seed the permanent guest/demo account used by "Try as guest" on the landing page |

### Frontend (`frontend/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server |
| `build` | `tsc -b && vite build` | Type-check + production build |
| `preview` | `vite preview` | Preview the production build locally |
| `lint` | `eslint .` | Run ESLint |
| `format` | `prettier --write` | Format all TS/TSX files |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |

---

## Testing & CI

- **Backend** — Jest + Supertest. `app.js` exports the configured Express app separately from `index.js`'s server-startup logic (DB connect, socket.io, `http.listen`), so routes and middleware can be exercised directly in tests with no live database or network calls required:
  - `middleware/fetchUser.js` — token presence/validity/signature cases
  - `Controllers/user-controller.js` (`getPresignedUrl`) — file-type and size-limit validation
  - `app.js` — health check, security headers, auth-gate and validation responses via Supertest
- **CI** — GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push/PR to `main`: backend tests (`npm test`) and a frontend job (`eslint` + a full `tsc -b && vite build`) in parallel.
- Run locally: `cd backend && npm test`

## Security Design

- **JWT access + refresh tokens** — the access token (`authtoken`) is a short-lived JWT (15 min, `JWT_ACCESS_EXPIRY`), verified on every protected REST route and every socket connection exactly as before. Alongside it, `/auth/login` and `/auth/register` issue an opaque, high-entropy **refresh token**; only its SHA-256 hash is stored (`User.refreshTokenHash`), so reading the database alone can't be used to authenticate as the user. `POST /auth/refresh` exchanges a valid refresh token for a new access token *and rotates the refresh token itself* — the old one stops working the instant a new one is issued. `POST /auth/logout` revokes it server-side. The frontend (`lib/api.ts`) handles all of this transparently: every call goes through a wrapper that catches a `401`, refreshes once, and retries — callers never see the expiry.
- **No trusted client IDs** — `senderId` is always taken from the verified JWT (`socket.userId`), never from the client payload
- **bcrypt** — passwords and OTPs are hashed with bcrypt before storage (the refresh token uses SHA-256 instead — see above — since a high-entropy random token gets nothing from bcrypt's slow salted hashing, and direct hash lookup is what `/auth/refresh` needs)
- **Block enforcement** — the server checks block status before processing every `send-message` event; a blocked sender receives `message-blocked` instead
- **Conversation membership** — every `join-chat` and `send-message` handler verifies the authenticated user is a member of the target conversation
- **Email verification gate** — the `DashboardLayout` component redirects unverified users to `/verify-email` before they can access any chat functionality; bot accounts are pre-verified at creation
- **R2 pre-signed uploads** — the client never receives storage credentials; uploads go directly to Cloudflare R2 through a short-lived pre-signed URL generated server-side, with size/type enforced by the signature itself
- **Rate limiting** — `express-rate-limit` caps auth endpoints at 30 requests/15min per IP (300/15min for the general API) to blunt brute-force and abuse
- **Security headers** — `helmet` sets standard hardening headers (`X-Content-Type-Options`, HSTS, etc.) on every response
- **Non-root Docker user** — the backend container runs as an unprivileged `appuser`
- **Account anonymisation** — deleted accounts have credentials wiped and PII replaced with generic values; the document is retained (flagged `isDeleted: true`) to preserve conversation context for other participants

### CORS & CSRF

- **CORS** (`CORS_ORIGIN`) is currently permissive (`*`) by default for easy local setup — set it to your frontend's exact origin in production (the deployed instance sets it to the live Cloudflare Pages URL). It only controls which **browser origins** may read the response; it is not an authentication mechanism.
- **CSRF isn't applicable here by design**, not just by omission: authentication is a JWT sent in a custom `auth-token` header, read from `localStorage` — never a cookie. CSRF works by a browser *automatically* attaching credentials (cookies) to a cross-site request; since nothing here is cookie-based, there is no ambient credential for a forged request to ride along on, and no CSRF token is needed. The trade-off is the usual one for header/localStorage auth over cookies: it's not vulnerable to CSRF, but the token is readable by JavaScript, so an XSS bug would be able to steal it — React's default output-escaping is the primary defense against that.

---

## Roadmap

A few things deliberately weren't built, in the interest of shipping working features over rushed, shaky ones:

- **OAuth (Google/GitHub login)** — needs OAuth apps registered with each provider (client ID/secret), which requires manual dashboard setup no API can do
- **Message encryption at rest** — real end-to-end encryption would mean the server literally cannot read message content, which conflicts with the AI chatbot reading conversation history to reply; encryption-at-rest (server can decrypt, but the database itself holds only ciphertext) is the compatible middle ground and the more realistic next step
- **Group conversations / thread branching** — the whole data model (`Conversation.members`, presence, unread counts) currently assumes exactly 2 participants; group chat is a genuine redesign, not an incremental add
- **Redis-backed presence/caching** — `userSocketMap` is an in-memory `Map`, which works for a single instance but wouldn't survive horizontal scaling (multiple server instances need a shared store for socket-to-user mapping); Upstash's free tier would be the natural fit
- **Analytics dashboard, load testing** — no engagement metrics or throughput numbers are collected; would be the next thing to add before treating this as more than a demo

## Background Jobs

### `staleOnlineUsers` (hourly cron)

Runs every hour and sets `isOnline: false` + updates `lastSeen` for any user whose `isOnline` flag is still `true` but has no active sockets in `userSocketMap`. This recovers from crash scenarios where the `disconnect` event was never fired.

---

## Contributing
Contributions are welcome! Please open an issue or submit a pull request with any improvements or bug fixes.

**Steps to contribute:**
1. Fork the repository and create a new branch for your feature or bug fix.
2. Make your changes with clear commit messages.
3. Ensure all tests pass and the application runs correctly.
4. Submit a pull request describing your changes and why they should be merged.

## License

MIT — see the [LICENSE](LICENSE) file for details.

---

## About the Author

Built by **Pankil Soni**

- Email: pmsoni2016@gmail.com
- LinkedIn: [pankil-soni-5a0541170](https://www.linkedin.com/in/pankil-soni-5a0541170/)
- Kaggle: [pankilsoni](https://www.kaggle.com/pankilsoni)
