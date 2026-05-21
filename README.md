# Titus — Student Book Exchange Platform

A full-stack web app for Cal State Fullerton students to post, browse, and exchange textbooks with each other.
Built with **React 18** (frontend) + **Express + MongoDB Atlas** (backend).

---

## Application Wireframe

Blueprint diagram of all screens and components:

**[View Interactive Wireframe →](https://htmlpreview.github.io/?https://github.com/Quang-cpsc120/Book-Exchange-Application/blob/main/client/public/wireframe.html)**

> Or locally while the app is running: [http://localhost:3000/wireframe.html](http://localhost:3000/wireframe.html)

---

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | React 18, React Router v6, Axios                  |
| Backend    | Node.js, Express 4                                |
| Database   | MongoDB Atlas via Mongoose                        |
| Auth       | JWT (JSON Web Tokens) + bcrypt                    |
| Fonts      | Inter (UI), Nunito (headings) via Google Fonts    |
| Dev tools  | nodemon, concurrently                             |

---

## Project Structure

```
bookswap/
├── package.json                   ← root: runs server + client together
├── server/
│   ├── index.js                   ← Express app, MongoDB connection, indexes
│   ├── .env                       ← secrets (not committed)
│   ├── models/
│   │   ├── User.js                ← student accounts + watchlist
│   │   ├── Book.js                ← book listings (isbn, subject, condition)
│   │   ├── ExchangeRequest.js     ← exchange agreements between students
│   │   ├── Conversation.js        ← messaging threads
│   │   ├── Message.js             ← individual chat messages
│   │   ├── ActivityLog.js         ← every user action, categorized
│   │   └── SearchLog.js           ← every search query with filters
│   ├── routes/
│   │   ├── auth.js                ← register, login, profile update
│   │   ├── books.js               ← CRUD + search/filter/recommend
│   │   ├── requests.js            ← exchange request flow
│   │   ├── messages.js            ← in-app messaging
│   │   ├── watchlist.js           ← saved searches
│   │   ├── activity.js            ← activity feed
│   │   └── admin.js               ← admin dashboard data
│   └── middleware/
│       ├── auth.js                ← JWT protect middleware
│       └── admin.js               ← admin-only guard
└── client/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                 ← routing + layout
        ├── index.css              ← CSUF brand tokens (blue #003DA5, orange #FF6B00)
        ├── context/
        │   ├── AuthContext.js     ← user session state
        │   └── MessagesContext.js ← messaging drawer state + unread count
        ├── pages/
        │   ├── AuthPage.js        ← sign in / register
        │   ├── HomePage.js        ← personalized feed + new arrivals slider
        │   ├── ProductPage.js     ← browse + filter sidebar
        │   ├── ProfilePage.js     ← profile, listings, requests, watchlist
        │   └── AdminPage.js       ← admin dashboard (charts, user logs)
        └── components/
            ├── Navbar.js          ← nav with messages icon + pending badge
            ├── BookCard.js        ← book tile
            ├── BookModal.js       ← book detail + exchange request form
            ├── PostBookModal.js   ← quick post with ISBN auto-fill
            ├── PostBook.js        ← full post form + my listings
            ├── MessagesModal.js   ← right-side chat drawer
            ├── ExchangeRequests.js
            ├── ActivityFeed.js
            └── Logo.js
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account (free tier works)

### 1 — Configure environment

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in:

```env
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/bookswap?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here
PORT=5000
```

> Make sure your Atlas cluster allows connections: **Network Access → Add IP → 0.0.0.0/0**

### 2 — Install all dependencies

```bash
# From the root bookswap/ folder
npm run install-all
```

### 3 — Run the app

```bash
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 4 — Verify connection

Terminal should show:
```
✅  MongoDB connected successfully
📦  Database: bookswap
📇  Database indexes ensured
🚀  BookSwap server running on http://localhost:5000
```

---

## MongoDB Collections

The app automatically creates and indexes these 8 collections:

| Collection          | Purpose                                                        |
|---------------------|----------------------------------------------------------------|
| `users`             | Student accounts, profile, classes, watchlist (embedded)      |
| `books`             | Book listings — title, author, subject, condition, ISBN, views |
| `exchangerequests`  | Exchange agreements (pending → accepted/declined/completed)    |
| `conversations`     | Messaging threads between two students, linked to a book       |
| `messages`          | Individual chat messages with read receipts                    |
| `activitylogs`      | Every user action, auto-tagged by category (see below)         |
| `searchlogs`        | Every browse query — keyword, major, class code, result count  |

---

## How MongoDB Tracks User Activity

Every meaningful action a student takes writes one or more documents to the database in real time. Here is the full data flow:

---

### Authentication

**Sign up**
```
users          ← new document: fullName, studentId, email, bcrypt-hashed password
activitylogs   ← action: "signup",  category: "auth"
```

**Log in**
```
activitylogs   ← action: "login",   category: "auth"
```

**Update profile** (name, department, year, classes, bio)
```
users          ← $set updated fields
activitylogs   ← action: "profile_update", category: "profile"
                  metadata: { fields: ["department", "classes"] }
```

---

### Book Catalog

**Post a book**
```
books          ← new document: title, author, subject, condition, isbn, owner ref
users          ← $inc booksPosted
activitylogs   ← action: "post_book", category: "catalog"
                  metadata: { subject, condition, isbn }
```

**View a book**
```
books          ← $inc views
activitylogs   ← action: "view_book", category: "catalog"
                  relatedBook: <bookId>
```

**Delete a listing**
```
books          ← document deleted
activitylogs   ← action: "delete_book", category: "catalog"
```

---

### Browse / Search

**Every search or filter applied on the Browse page**
```
searchlogs     ← new document:
                  query:        "algorithms"     (free-text)
                  subject:      "Computer Science"
                  classCode:    "CPSC 335"
                  condition:    "Good"
                  sort:         "newest"
                  resultsCount: 4
                  page:         "browse"
```

> Zero-result searches (`resultsCount: 0`) are especially useful — they reveal what books students need that nobody has posted yet.

---

### Exchange Requests

**Send a request**
```
exchangerequests ← new document: requester, bookOwner, book, offerBook, status:"pending"
activitylogs     ← action: "request_sent",     category: "exchange"
                    relatedBook, relatedRequest
```

**Accept a request**
```
exchangerequests ← status → "accepted"
exchangerequests ← all other pending requests for same book → status "declined"
books            ← available → false
users (×2)       ← $inc exchangesCompleted  (both parties)
activitylogs     ← action: "request_accepted", category: "exchange"
```

**Decline a request**
```
exchangerequests ← status → "declined"
activitylogs     ← action: "request_declined", category: "exchange"
```

**Mark as completed**
```
activitylogs     ← action: "request_completed", category: "exchange"
                    metadata: { bookTitle, bookSubject }
```

---

### In-App Messaging

**Start a conversation** (click "Message Seller" on a book)
```
conversations  ← new document: participants [userA, userB], book ref, lastMessage, lastAt
```

**Send a message**
```
messages       ← new document: conversation ref, sender, text, readBy: [sender]
conversations  ← $set lastMessage, lastAt
activitylogs   ← action: "message_sent", category: "messaging"
                  relatedConversation, metadata: { bookId }
```

**Read messages**
```
messages       ← $addToSet readBy: [currentUser]  (marks all unread as read)
```

---

### Watchlist (Saved Searches)

**Save a search**
```
users          ← $push watchlist: { keywords, subject, createdAt }
activitylogs   ← action: "watchlist_add", category: "discovery"
                  metadata: { keywords, subject }
```

**Remove a saved search**
```
users          ← $pull watchlist by _id
activitylogs   ← action: "watchlist_remove", category: "discovery"
```

---

### Activity Categories at a Glance

Every `activitylogs` document carries a `category` field set automatically:

| Category    | Actions                                                              |
|-------------|----------------------------------------------------------------------|
| `auth`      | signup, login                                                        |
| `catalog`   | post_book, view_book, delete_book, isbn_lookup                       |
| `exchange`  | request_sent, request_accepted, request_declined, request_completed  |
| `messaging` | message_sent                                                         |
| `discovery` | watchlist_add, watchlist_remove                                      |
| `profile`   | profile_update                                                       |

Example analytics queries you can run on Atlas:

```js
// Most popular book subjects this month
db.searchlogs.aggregate([
  { $match: { createdAt: { $gte: new Date("2026-05-01") }, subject: { $ne: "" } } },
  { $group: { _id: "$subject", searches: { $sum: 1 } } },
  { $sort: { searches: -1 } }
])

// Classes with highest student demand (zero-result searches)
db.searchlogs.aggregate([
  { $match: { classCode: { $ne: "" }, resultsCount: 0 } },
  { $group: { _id: "$classCode", demand: { $sum: 1 } } },
  { $sort: { demand: -1 } }
])

// Daily active users
db.activitylogs.aggregate([
  { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, user: "$user" } } },
  { $group: { _id: "$_id.date", dau: { $sum: 1 } } },
  { $sort: { _id: -1 } }
])

// Exchange conversion rate (requests sent vs accepted)
db.activitylogs.aggregate([
  { $match: { category: "exchange" } },
  { $group: { _id: "$action", count: { $sum: 1 } } }
])
```

---

## API Endpoints

### Auth
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| POST   | /api/auth/register     | Create student account             |
| POST   | /api/auth/login        | Sign in, returns JWT               |
| GET    | /api/auth/me           | Get current user                   |
| PATCH  | /api/auth/profile      | Update profile                     |

### Books
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /api/books             | Browse (q, subject, classCode, condition, sort) |
| GET    | /api/books/recommended | Personalized feed by major + classes |
| GET    | /api/books/mine        | My posted books                    |
| GET    | /api/books/:id         | View book detail (increments views)|
| POST   | /api/books             | Post a new book (supports isbn)    |
| PATCH  | /api/books/:id         | Update availability or fields      |
| DELETE | /api/books/:id         | Remove a listing                   |

### Exchange Requests
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /api/requests          | Get incoming + outgoing requests   |
| POST   | /api/requests          | Send an exchange request           |
| PATCH  | /api/requests/:id      | Accept / decline / complete        |

### Messages
| Method | Endpoint                    | Description                   |
|--------|-----------------------------|-------------------------------|
| GET    | /api/messages               | List my conversations         |
| GET    | /api/messages/unread        | Unread message count          |
| POST   | /api/messages/start         | Start or find a conversation  |
| GET    | /api/messages/:convId       | Get messages in thread        |
| POST   | /api/messages/:convId       | Send a message                |
| PATCH  | /api/messages/:convId/read  | Mark all messages as read     |

### Watchlist
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /api/watchlist         | Get my saved searches              |
| POST   | /api/watchlist         | Save a search                      |
| DELETE | /api/watchlist/:id     | Remove a saved search              |

### Activity
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /api/activity          | Get my activity feed               |

### Admin (requires isAdmin)
| Method | Endpoint                    | Description                   |
|--------|-----------------------------|-------------------------------|
| GET    | /api/admin/overview         | Platform stats                |
| GET    | /api/admin/users            | All users                     |
| GET    | /api/admin/users/:id        | User detail + activity log    |
| GET    | /api/admin/searches         | Search analytics              |
| GET    | /api/admin/exchanges        | Exchange analytics            |
| POST   | /api/admin/make-admin       | Grant admin to a student ID   |

---

## Admin Access

To grant yourself admin access, run this in your terminal while the server is running:

```bash
curl -X POST http://localhost:5000/api/admin/make-admin \
  -H "Content-Type: application/json" \
  -d "{\"studentId\": \"YOUR_STUDENT_ID\"}"
```

Then **log out and log back in**. The Admin Dashboard link will appear in your navbar dropdown.

---

## Troubleshooting

**MongoDB connection fails**
- Check `MONGO_URI` in `server/.env`
- Whitelist your IP: Atlas → Network Access → Add IP → 0.0.0.0/0
- URL-encode special characters in your password (e.g. `@` → `%40`)

**Port already in use**
- Set `PORT=5001` in `server/.env`
- Update `"proxy"` in `client/package.json` to match

**"Cannot find module" errors**
- Run `npm run install-all` again from the root folder

**Admin link not showing after make-admin**
- Log out and log back in — the JWT is re-issued with the updated user on login
