# Barangay Connect Hub

A modern, full-stack web application for community engagement and barangay management.

## Project Structure

This is a monorepo containing both frontend and backend applications.

```
barangay-connect-hub/
├── frontend/              # React + Vite + TypeScript frontend application
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   ├── config/           # Build and dev configs
│   ├── index.html        # HTML entry point
│   ├── package.json      # Frontend dependencies
│   └── tailwind.config.ts # TailwindCSS configuration
│
├── backend/              # Node.js + Express backend application
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── config/           # Database and configuration
│   ├── utils/            # Utilities and helpers
│   ├── index.ts          # Server entry point
│   └── package.json      # Backend dependencies
│
├── supabase/             # Supabase configuration (optional)
├── .env                  # Environment variables (root level)
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- MongoDB (for backend)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Run database seeds
npm run seed-admin
npm run seed-announcements
```

Backend runs on `http://localhost:5000`

## Environment Variables

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/barangay-connect
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend

- `npm run dev` - Start development server with auto-reload
- `npm run start` - Start production server
- `npm run seed-admin` - Seed admin user to database
- `npm run seed-announcements` - Seed sample announcements
- `npm run reset-admin` - Reset admin user

## Architecture

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript
- **State Management**: React Query, Context API
- **Routing**: React Router

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Validation**: Custom middleware
- **File Uploads**: Multer

## Features

- User authentication and authorization
- Incident reporting system
- Document request management
- Polls and voting
- SMS alerts
- Announcements and notifications
- Admin dashboard
- User profile management
- Real-time notifications

## Development Workflow

1. Start the backend server

   ```bash
   cd backend && npm run dev
   ```

2. In another terminal, start the frontend dev server

   ```bash
   cd frontend && npm run dev
   ```

3. Open `http://localhost:5173` in your browser

## Building for Production

### Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Backend

```bash
cd backend
npm run build
# Backend uses tsx for runtime compilation, no build needed
```

## Database

The application uses MongoDB. Ensure MongoDB is running before starting the backend server.

### Default Collections

- users
- incidents
- documentrequests
- polls
- notifications
- smsalerts
- announcements

## API Documentation

API endpoints are documented in the backend routes:

- `/routes/auth.ts` - Authentication
- `/routes/incidents.ts` - Incidents
- `/routes/documents.ts` - Document requests
- `/routes/polls.ts` - Polls
- `/routes/notifications.ts` - Notifications
- `/routes/sms.ts` - SMS alerts
- `/routes/announcements.ts` - Announcements
- `/routes/admin.ts` - Admin operations

## Troubleshooting

### Backend won't start

- Check if MongoDB is running: `mongod`
- Verify `.env` file in backend directory
- Check if port 5000 is available

### Frontend won't start

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 5173 is available
- Verify `.env` file in frontend directory

### API connection issues

- Ensure both servers are running
- Check if `VITE_API_URL` is correct in frontend `.env`
- Check CORS settings in backend

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - feel free to use this project for your community.

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Last Updated**: December 8, 2024
