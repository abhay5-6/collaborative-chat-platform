# Rework - Real-Time Collaboration Platform

Live Demo: https://rework-hu9apeyxg-abhay5-6s-projects.vercel.app/

A modern real-time collaborative chat platform built with FastAPI, Next.js, PostgreSQL, and WebSockets.

Rework combines real-time communication, room-based collaboration, moderation tools, hierarchy systems, and live notifications into a scalable full-stack architecture.

## demo
demo in /demo

Features
Authentication
JWT-based authentication
Secure login/register system
Protected API routes
Persistent frontend auth state
Room System
Create public or private rooms
Join/leave rooms
Room ownership system
Real-time room communication
Real-Time Messaging
WebSocket-powered chat
Live message broadcasting
Typing indicators
Online user tracking
Auto-reconnect handling
Private Room Access Requests
Request access to private rooms
Approve/reject requests
Notification-based request workflow
Hierarchy & Moderation
Owner / Admin / Member roles
Promote or demote users
Remove members
Permission-based governance system
Notifications
Navbar notification system
Live join request notifications
Pending request tracking
Tech Stack
Frontend
Next.js
React
TypeScript
TailwindCSS
Axios
WebSockets
Sonner (toast notifications)
Backend
FastAPI
SQLAlchemy (Async)
PostgreSQL
JWT Authentication
WebSockets
Pydantic
Project Structure
backend/
├── app/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── websocket/
│
frontend/
├── app/
├── components/
├── hooks/
├── lib/
│   ├── api/
│   └── websocket/
├── public/
└── stores/
Backend Architecture

The backend follows a layered architecture:

Routes

Responsible for:

HTTP endpoints
request/response handling
authentication dependency injection
Services

Responsible for:

business logic
room logic
moderation logic
message persistence
membership management
Models

SQLAlchemy database models.

Schemas

Pydantic request/response validation.

WebSocket Layer

Handles:

socket authentication
live messaging
typing events
online presence
broadcasting
Frontend Architecture

The frontend is intentionally kept lightweight.

API Layer

All HTTP calls are centralized inside:

lib/api/

This prevents scattered fetch logic and improves maintainability.

WebSocket Layer

Socket creation and connection logic are isolated from UI rendering.

Component Structure
reusable UI components
room-specific pages
centralized auth provider
notification components
Real-Time System

Rework uses a hybrid architecture:

REST API

Used for:

authentication
room creation
join requests
moderation
fetching messages
WebSockets

Used for:

live chat
typing indicators
online users
realtime events

This architecture keeps the application scalable and stable.

Installation
Clone Repository
git clone <your-repository-url>
cd rework
Backend Setup
Create Virtual Environment
python -m venv venv
Activate Virtual Environment
Windows
venv\Scripts\activate
Linux / Mac
source venv/bin/activate
Install Dependencies
pip install -r requirements.txt
Configure Environment Variables

Create:

backend/.env

Example:

DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/rework_db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
Run Backend
uvicorn app.main:app --reload

Backend runs on:

http://127.0.0.1:8000
Frontend Setup
Install Dependencies
npm install
Configure Environment Variables

Create:

frontend/.env.local

Example:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
Run Frontend
npm run dev

Frontend runs on:

http://localhost:3000
API Highlights
Authentication
POST /auth/register
POST /auth/login
GET  /auth/me
Rooms
GET    /rooms/
POST   /rooms/
POST   /rooms/{room_id}/join
POST   /rooms/{room_id}/leave
DELETE /rooms/{room_id}
Messages
GET  /rooms/{room_id}/messages
POST /rooms/{room_id}/messages
Governance
GET  /rooms/{room_id}/members
POST /rooms/{room_id}/promote/{user_id}
POST /rooms/{room_id}/demote/{user_id}
POST /rooms/{room_id}/remove/{user_id}
Join Requests
GET  /rooms/join-requests
POST /rooms/join-requests/{request_id}/approve
POST /rooms/join-requests/{request_id}/reject
Current Status
Implemented
Authentication
Public/private rooms
Real-time chat
WebSocket lifecycle handling
Notifications
Join request workflow
Role hierarchy system
Moderation controls
Planned
Friend system
Direct messages
AI-powered room features
Advanced notifications
Deployment scaling improvements
Deployment Plan
Frontend
Vercel
Backend
Railway or Render
Database
Neon PostgreSQL
Screenshots

Add screenshots here after deployment.

Learning Goals Behind The Project

This project was built to explore:

scalable realtime architecture
async backend systems
websocket lifecycle management
role-based permissions
frontend/backend separation
production-style API design
License

This project is open-source and available under the MIT License.

Author

Built by Abhay Tewatia.

