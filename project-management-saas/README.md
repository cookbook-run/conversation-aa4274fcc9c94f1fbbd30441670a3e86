# Project Management SaaS Dashboard

A minimalist project management web application inspired by Trello, built with React and Node.js.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Project Management**: Create, update, and delete projects
- **Task Management**: Create tasks and organize them in columns (To Do, In Progress, Done)
- **Drag & Drop**: Intuitive task reordering between columns
- **Minimalist Design**: Clean, functional interface using Tailwind CSS

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- @dnd-kit for drag-and-drop functionality
- Axios for API calls
- Vite for fast development

### Backend
- Node.js with Express
- SQLite database
- JWT for authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd project-management-saas
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```
The server will run on http://localhost:54995

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```
The client will run on http://localhost:55317

3. Open your browser and navigate to http://localhost:55317

## Usage

1. **Register/Login**: Create a new account or login with existing credentials
2. **Create Project**: Click "New Project" to create your first project
3. **Add Tasks**: Inside a project, click the + button in any column to add tasks
4. **Organize Tasks**: Drag and drop tasks between columns to update their status
5. **Manage Projects**: Click on any project card to view and manage its tasks

## Security Notes

- Change the JWT_SECRET in the .env file for production use
- Passwords are hashed using bcrypt
- API endpoints are protected with JWT authentication
- Input validation is implemented on both client and server

## Future Enhancements

- Team collaboration features
- Task assignments to team members
- Due dates and priorities
- File attachments
- Activity logs
- Email notifications