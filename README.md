# ProjectHub - Full Stack Project Management Application

This is a full-stack project management application built with React (Frontend) and Node.js/Express (Backend).

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, SQLite, JWT Authentication
- **Database**: SQLite (file-based)

## Project Structure

```
.
├── backend/
│   ├── server.js           # Main server file
│   ├── database.js         # Database configuration
│   ├── database.sqlite     # SQLite database file
│   ├── middleware/         # Authentication middleware
│   ├── routes/             # API routes (auth, projects, tasks)
│   └── package.json        # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Auth context
│   │   ├── utils/          # API utilities
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
│
└── package.json            # Root package file
```

## Database Location

The SQLite database file is located at:
```
backend/database.sqlite
```

This file contains all the application data including:
- Users table (user accounts and authentication)
- Projects table (project information)
- Tasks table (tasks associated with projects)

## How to Launch the Application

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cookbook-run/conversation-aa4274fcc9c94f1fbbd30441670a3e86.git
cd conversation-aa4274fcc9c94f1fbbd30441670a3e86
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

You need to run both the backend and frontend servers:

#### Option 1: Using separate terminal windows

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
# Server will run on http://localhost:5001
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:3001 (or next available port)
```

#### Option 2: Using a single terminal with background process

```bash
# Start backend in background
cd backend && npm start &

# Start frontend
cd ../frontend && npm run dev
```

### Default Ports

- **Backend API**: http://localhost:5001
- **Frontend**: http://localhost:3001 (configurable in `frontend/vite.config.js`)

The frontend is configured to proxy API requests to the backend automatically.

## Environment Variables

The backend uses a `.env` file for configuration:

```env
PORT=5001
JWT_SECRET=your-secret-key-here
```

## Features

- User Authentication (Register/Login)
- Create, Read, Update, Delete Projects
- Create, Read, Update, Delete Tasks within Projects
- JWT-based authentication
- Responsive design with Tailwind CSS

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects for logged-in user
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks/project/:projectId` - Get all tasks for a project
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error, you can:
1. Kill the process using the port: `lsof -ti:PORT | xargs kill -9`
2. Or change the port in the configuration files

### Database Issues
If you encounter database errors:
1. Check if `backend/database.sqlite` exists
2. Ensure the backend process has write permissions
3. The database is automatically created on first run

## Development

This project was initially built using OpenHands AI assistant and backed up from conversation aa4274fcc9c94f1fbbd30441670a3e86.