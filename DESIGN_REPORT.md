# Design Report

## Architecture

The application is a monolithic Next.js 14 App Router project that serves both the UI and the API.

```
Browser -> Next.js App Router (port 3000)
              ├── /app/*          -> React UI pages (client components)
              ├── /api/*          -> Route Handlers (server-side API)
              └── Prisma Client   -> PostgreSQL (port 5432)
```

All write operations are protected at the API layer by reading the `userId` HTTP-only cookie set at login.

## Database Choice: PostgreSQL + Prisma

PostgreSQL was chosen because:
- Strong support for relational data (channels -> posts -> replies -> votes)
- ACID compliance ensures vote uniqueness constraints are enforced
- Prisma provides type-safe queries and easy migrations
- Works well with Docker

## Data Model

| Table | Purpose |
|-------|---------|
| User | Auth credentials (hashed), display name, role (USER/ADMIN) |
| Channel | Named discussion space, created by a user |
| Post | Question/message in a channel, belongs to author |
| Reply | Threaded response to a post or another reply (parentReplyId for nesting) |
| Vote | One row per user per target (enforced via unique constraint). value = +1 or -1 |
| Attachment | File metadata + path. Linked polymorphically to Post or Reply |

The Vote table enforces uniqueness with `@@unique([userId, postId, replyId])` — only one vote per user per target.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/channels | No | List all channels with post counts |
| POST | /api/channels | Yes | Create a channel |
| DELETE | /api/channels/[id] | ADMIN | Delete channel + cascade |
| GET | /api/posts?channelId= | No | List posts in channel |
| POST | /api/posts | Yes | Create a post |
| DELETE | /api/posts/[id] | ADMIN | Delete post + cascade |
| GET | /api/replies?postId= | No | List replies for a post |
| POST | /api/replies | Yes | Create a reply (supports parentReplyId) |
| DELETE | /api/replies/[id] | ADMIN | Delete a reply |
| POST | /api/votes | Yes | Cast/update/remove a vote |
| GET | /api/votes?postId= | No | Get vote score for a target |
| POST | /api/upload | Yes | Upload a screenshot (PNG/JPEG/WebP ≤5MB) |
| GET | /api/search?type=&q= | No | Search (6 query types, paginated) |
| POST | /api/auth/login | No | Login, sets userId cookie |
| POST | /api/auth/signup | No | Register new user |
| POST | /api/auth/logout | No | Clears cookie |
| GET | /api/auth/me | No | Returns current user from cookie |
| DELETE | /api/users/[id] | ADMIN | Remove a user |
| GET | /api/admin/users | ADMIN | List all users |

## Screenshot Upload Approach

- Route: `POST /api/upload` (multipart/form-data)
- Validation: MIME type checked against allowlist (`image/png`, `image/jpeg`, `image/webp`) AND file extension double-checked
- Size limit: 5 MB per image
- Storage: Saved to `public/uploads/<timestamp>-<random>.<ext>` on the container filesystem (mounted via Docker volume in production)
- Served: Directly via Next.js static file serving from `/public` — no raw execution possible
- DB record: An `Attachment` row stores mimeType, sizeBytes, path, and links to postId or replyId

## Key Packages

| Package | Purpose |
|---------|---------|
| next 16 | Full-stack React framework, App Router for both UI and API |
| prisma + @prisma/client | Type-safe ORM, migrations, schema |
| bcrypt | Password hashing (salt rounds: 10) |
| typescript | Type safety across the codebase |
| postgres:15 (Docker image) | Production-grade relational DB |

## Security Measures

- Passwords hashed with bcrypt (never stored plaintext)
- Auth via HTTP-only cookie (not accessible to JS)
- All write API routes check cookie presence
- Admin routes additionally check `role === "ADMIN"`
- File uploads: MIME type + extension validated; files stored outside web-executable paths
- Input length limits on titles (200), bodies (5000), channel names (50)
- XSS: React's JSX rendering escapes output by default
