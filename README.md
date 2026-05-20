# 📚 BookSwap — Student Book Exchange Platform

A full-stack app for students to post, browse, and exchange textbooks.
Built with **React** (frontend) + **Express + MongoDB** (backend).

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Axios                         |
| Backend    | Node.js, Express 4                      |
| Database   | MongoDB Atlas via Mongoose              |
| Auth       | JWT (JSON Web Tokens) + bcrypt          |
| Dev tools  | nodemon, concurrently                   |

---

## Project Structure

```
bookswap/
├── package.json              ← root: runs both server + client
├── server/
│   ├── index.js              ← Express app + MongoDB connection
│   ├── .env.example          ← copy to .env and fill in your values
│   ├── models/
│   │   ├── User.js           ← student accounts
│   │   ├── Book.js           ← book listings
│   │   ├── ExchangeRequest.js← exchange agreements
│   │   └── ActivityLog.js    ← per-student activity history
│   ├── routes/
│   │   ├── auth.js           ← POST /register, POST /login, GET /me
│   │   ├── books.js          ← CRUD for book listings
│   │   ├── requests.js       ← exchange request flow
│   │   └── activity.js       ← GET activity feed
│   └── middleware/
│       └── auth.js           ← JWT protect middleware
└── client/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── utils/api.js      ← Axios instance with JWT interceptor
        ├── context/AuthContext.js
        ├── pages/
        │   ├── AuthPage.js   ← Sign in / Register
        │   └── MainApp.js    ← Shell with nav tabs
        └── components/
            ├── BrowseBooks.js
            ├── PostBook.js
            ├── ExchangeRequests.js
            └── ActivityFeed.js
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+ installed
- A MongoDB Atlas account (free tier works)

---

### Step 1 — Get your MongoDB connection string

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and log in
2. In your cluster, click **Connect** → **Drivers**
3. Copy the connection string — it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```
4. Replace `<password>` with your actual password

---

### Step 2 — Configure the server

```bash
# In the server folder, copy the example env file
cd server
cp .env.example .env
```

Open `server/.env` and fill in:

```env
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/bookswap?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here
PORT=5000
```

> ⚠️  Make sure your MongoDB Atlas cluster allows connections from `0.0.0.0/0`
> (Atlas → Network Access → Add IP Address → Allow from anywhere)

---

### Step 3 — Install all dependencies

From the **root** `bookswap/` folder:

```bash
npm run install-all
```

This installs packages for root, server, and client in one command.

---

### Step 4 — Run the app

```bash
# From the root bookswap/ folder
npm run dev
```

This starts both servers concurrently:
- 🚀 **Backend**: http://localhost:5000
- ⚛️  **Frontend**: http://localhost:3000

Open http://localhost:3000 in your browser.

---

### Step 5 — Verify the MongoDB connection

Check the terminal — you should see:
```
✅  MongoDB connected successfully
📦  Database: bookswap
🚀  BookSwap server running on http://localhost:5000
```

You can also hit the health check endpoint:
```
http://localhost:5000/api/health
```

---

## MongoDB Collections

BookSwap automatically creates these collections in your database:

| Collection        | Purpose                                              |
|-------------------|------------------------------------------------------|
| `users`           | Student accounts (hashed passwords, student IDs)     |
| `books`           | Book listings with owner reference                   |
| `exchangerequests`| Exchange agreements between students                 |
| `activitylogs`    | Every student action timestamped and stored          |

---

## API Endpoints

### Auth
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| POST   | /api/auth/register   | Create student account   |
| POST   | /api/auth/login      | Sign in, returns JWT     |
| GET    | /api/auth/me         | Get current user         |

### Books
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | /api/books           | Browse available books   |
| GET    | /api/books/mine      | My posted books          |
| GET    | /api/books/:id       | View book (logs activity)|
| POST   | /api/books           | Post a new book          |
| PATCH  | /api/books/:id       | Update availability      |
| DELETE | /api/books/:id       | Remove a listing         |

### Exchange Requests
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | /api/requests        | Get my requests          |
| POST   | /api/requests        | Send exchange request    |
| PATCH  | /api/requests/:id    | Accept or decline        |

### Activity
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | /api/activity        | Get my activity feed     |

---

## VS Code Tips

- Install the **MongoDB for VS Code** extension (in `.code-workspace` recommendations)
  to browse your database collections directly from VS Code
- Use the **dotenv** extension for `.env` syntax highlighting
- Open the workspace file: `File → Open Workspace from File → bookswap.code-workspace`

---

## Troubleshooting

**MongoDB connection fails**
- Double-check your `MONGO_URI` in `server/.env`
- Whitelist your IP in Atlas → Network Access
- Make sure the password has no special characters that need URL-encoding

**Port already in use**
- Change `PORT=5001` in `server/.env`
- Update the proxy in `client/package.json` to match

**"Cannot find module" errors**
- Run `npm run install-all` again from the root folder
