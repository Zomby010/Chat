MindMate - Mental Health Support Platform
 Features

AI Chatbot: Empathetic conversations with crisis detection
Mood Tracking: Interactive mood check-ins with visual feedback
Breathing Exercises: Guided sessions with sound and progress tracking
Crisis Resources: Immediate access to emergency mental health services
Authentication: Secure login with Firebase (email, Google, Facebook)
Responsive Design: Mobile-first, accessible interface

Architecture
Frontend (/frontend)

React 18 with modern hooks and components
Firebase Auth for user management
Lucide Icons and CSS animations
Mobile-responsive design

Backend
Robust Node.js/Express server with:

Route Handling: RESTful APIs (/api/chat, /api/auth)
Middleware: Authentication, CORS, rate limiting, validation, error handling
Controllers: Chat, user, crisis detection, and analytics management
Security: JWT tokens, HIPAA compliance, data encryption

 Quick Start

Clone & Install

bash   git clone https://github.com/yourusername/mindmate.git
   cd mindmate
   
   # Install dependencies
   cd frontend && npm install
   cd ../backend && npm install

Environment Setup
Frontend .env:

env   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_FIREBASE_API_KEY=your_firebase_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
Backend .env:
env   PORT=5000
   OPENAI_API_KEY=your_openai_key
   FIREBASE_ADMIN_SDK=path_to_service_account.json
   JWT_SECRET=your_jwt_secret

Run Development Servers

bash   # Backend (Terminal 1)
   cd backend && npm run dev
   
   # Frontend (Terminal 2) 
   cd frontend && npm start

Access: Frontend at http://localhost:3000

 API Endpoints
javascriptPOST /api/chat/init        // Initialize chat session
POST /api/chat/message     // Send message to AI
POST /api/auth/login       // User authentication
POST /api/auth/register    // User registration
🛡 Security & Privacy

HIPAA Compliant: Healthcare data protection
Encrypted Communications: All data secured in transit
Crisis Detection: Automatic emergency resource provision
Anonymous Options: Optional anonymous usage

 Tech Stack
Frontend: React, Firebase Auth, Lucide React, CSS3
Backend: Node.js, Express, OpenAI API, Firebase Admin, JWT
Database: Firebase Firestore
Deployment: Firebase Hosting, Node.js server
 Crisis Resources

988 - Suicide & Crisis Lifeline
911 - Emergency Services
741741 - Crisis Text Line



