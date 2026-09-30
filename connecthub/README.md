# 🔗 ConnectHub

Share your thoughts, connect with people, grow your circle.

ConnectHub is a full-stack mini social media platform built for **CodeAlpha Full Stack Development Internship – Task 2**.

## Features
- Register / login (bcrypt + JWT), logout, protected API routes
- User profiles (view, edit name / bio / picture)
- Posts with text, optional image and feeling; newest first; delete own posts
- Like / unlike (no duplicate likes)
- Comments (add, list, delete own)
- Follow / unfollow (no self-follow, no duplicates)
- Search people by name or username
- Notifications for likes, comments and follows (unread highlighted)
- Dark / light theme saved in localStorage
- Responsive layout, friendly empty states and messages

## Technologies
HTML5, CSS3, vanilla JavaScript · Node.js, Express 5 · MongoDB, Mongoose · JWT, bcryptjs

## Screenshots
Add your screenshots here (e.g. `docs/feed.png`, `docs/profile.png`).

## Installation
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run seed              # optional demo data
npm start                 # or: npm run dev
```
Open http://localhost:5000 (Express serves the frontend and the API).

## Environment variables
| Name | Description |
|------|-------------|
| PORT | Server port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Long random string used to sign tokens |

## MongoDB setup
- **Local:** install MongoDB Community, start `mongod`, use `mongodb://127.0.0.1:27017/connecthub`.
- **Atlas:** create a free cluster, add a database user, allow your IP, paste the connection string into `MONGO_URI`.

## Demo accounts (after `npm run seed`)
`amal`, `rahul`, `priya` — password `password123`

## API overview
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Create account / log in |
| GET | /api/auth/me | Current user |
| GET | /api/users/search?q= | Search users |
| GET / PUT | /api/users/:id | View / edit profile |
| POST / DELETE | /api/users/:id/follow | Follow / unfollow |
| GET / POST | /api/posts | Feed (`?user=id` filter) / create post |
| GET / DELETE | /api/posts/:id | Single post / delete own |
| POST / DELETE | /api/posts/:id/like | Like / unlike |
| GET / POST | /api/posts/:id/comments | List / add comments |
| DELETE | /api/comments/:id | Delete own comment |
| GET | /api/notifications | List notifications |
| PUT | /api/notifications/:id/read, /read-all | Mark read |

## Testing checklist
Register A → login → post → logout → login B → open A's profile → follow → like → comment → logout → login A → check notifications, follower/like/comment counts → edit profile → delete post/comment → search → toggle theme → resize to mobile.

## Future enhancements
Real-time notifications (Socket.io), image storage (Cloudinary), pagination / infinite scroll, password reset, hashtags, direct messages.
