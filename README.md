# Incident Reporter

<div align="center">

A real-time mobile application for reporting and viewing traffic incidents on an interactive map. Users can report road incidents, vote on incident confirmation and resolution, and receive notifications of nearby incidents.

![NestJS](https://img.shields.io/badge/NestJS-v11-EA2845?logo=nestjs&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2054-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Included-336791?logo=postgresql&logoColor=white)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API Documentation](#api-documentation) • [Architecture](#architecture)

</div>

---

## Overview

Incident Reporter is a full-stack mobile and web application that enables users to collaboratively report and track traffic incidents in real-time. The application features real-time incident synchronization via WebSockets, JWT-based authentication, location-based notifications, and an intuitive map interface for incident visualization.

## Features

✨ **Core Features**

- 📍 **Real-time Incident Reporting** – Create and report incidents at precise GPS coordinates
- 🗺️ **Interactive Map Display** – View all reported incidents on an interactive map with reverse geocoding
- 🔐 **Secure Authentication** – JWT-based authentication with user account management
- ⚡ **Real-time Updates** – WebSocket support via Socket.IO for instant incident synchronization across all clients
- 🔔 **Proximity Notifications** – Receive push notifications for incidents near your current location
- 👥 **Community Voting** – Report and resolve incidents through community consensus
- 📸 **Multi-Media Support** – Attach images and descriptions to incidents
- 🌍 **Reverse Geocoding** – Automatic location name resolution via Nominatim

## Tech Stack

### Backend

- **Framework:** NestJS 11 with TypeScript
- **Database:** PostgreSQL with TypeORM
- **Authentication:** Passport.js with JWT
- **Real-time Communication:** Socket.IO
- **Password Security:** bcrypt hashing
- **Geocoding:** Nominatim (OpenStreetMap)

### Frontend

- **Runtime:** Expo SDK 54
- **Framework:** React Native with TypeScript
- **Navigation:** React Navigation (stack & bottom tab navigation)
- **Maps:** react-native-maps
- **Location Services:** Expo Location API
- **Notifications:** Expo Notifications
- **Networking:** Axios + Socket.IO Client
- **State Management:** React Context API
- **Storage:** AsyncStorage

### DevOps & Quality

- **Testing:** Jest (unit & e2e tests)
- **Linting:** ESLint with TypeScript support
- **Code Formatting:** Prettier

## Getting Started

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **PostgreSQL:** v12 or higher (for backend)
- **Expo CLI:** Install with `npm install -g eas-cli`
- **Android Emulator** or **iOS Simulator** (for mobile development)

### Environment Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/incident-reporter.git
cd incident-reporter
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=incident_reporter

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Environment
NODE_ENV=development
```

Start the backend:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

Update the API and Socket.IO base URLs in [frontend/src/services/api.ts](frontend/src/services/api.ts) to match your backend server:

```typescript
const API_BASE_URL = "http://YOUR_BACKEND_IP:3000";
```

Start the frontend:

```bash
npx expo start
```

Then press:

- `a` for Android Emulator
- `i` for iOS Simulator
- `w` for Web (limited functionality)

## API Documentation

### Authentication Endpoints

All incident-related routes require an `Authorization: Bearer <JWT_TOKEN>` header.

| Method | Route            | Description                        | Auth Required |
| ------ | ---------------- | ---------------------------------- | ------------- |
| `POST` | `/auth/register` | Create a new user account          | No            |
| `POST` | `/auth/login`    | Authenticate and receive JWT token | No            |

**Request/Response Examples:**

**Register:**

```bash
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Login:**

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securePassword123"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Incident Endpoints

| Method   | Route                    | Description                                      | Auth Required |
| -------- | ------------------------ | ------------------------------------------------ | ------------- |
| `GET`    | `/incidents`             | Fetch all incidents                              | Yes           |
| `POST`   | `/incidents`             | Create a new incident                            | Yes           |
| `DELETE` | `/incidents/:id`         | Delete an incident                               | Yes           |
| `POST`   | `/incidents/:id/report`  | Vote to report/confirm an incident               | Yes           |
| `POST`   | `/incidents/:id/resolve` | Vote to resolve an incident (removes at 3 votes) | Yes           |

**Create Incident:**

```bash
POST /incidents
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "lat": 40.7128,
  "lon": -74.0060,
  "type": "accident",
  "severity": "high",
  "description": "Multi-vehicle collision on Broadway"
}
```

**Report Incident:**

```bash
POST /incidents/1/report
Authorization: Bearer <TOKEN>
```

**Resolve Incident:**

```bash
POST /incidents/1/resolve
Authorization: Bearer <TOKEN>
```

### Real-time Events (Socket.IO)

The WebSocket gateway broadcasts the following events to all connected clients:

- `newIncident` – A new incident has been created
- `removeIncident` – An incident has been deleted
- `reportCount` – An incident's report count has been updated
- `resolveVote` – An incident's resolve count has been updated

**Example Event Payloads:**

```javascript
// newIncident
{
  id: 1,
  lat: 40.7128,
  lon: -74.0060,
  type: "accident",
  severity: "high",
  address: "Broadway, New York, NY",
  reportCount: 1,
  resolveCount: 0,
  reportedBy: 42,
  reporterUsername: "john_doe"
}

// reportCount
{
  incidentId: 1,
  reportCount: 3
}

// resolveVote
{
  incidentId: 1,
  resolveCount: 2
}
```

## Architecture

### Project Structure

```
incident-reporter/
├── backend/                 # NestJS REST API & WebSocket Server
│   ├── src/
│   │   ├── auth/           # JWT authentication & authorization
│   │   ├── incidents/      # Incident management & WebSocket gateway
│   │   ├── users/          # User management
│   │   ├── ai-insights/    # AI-powered insights (future)
│   │   └── app.module.ts   # Root application module
│   └── test/               # E2E tests
│
└── frontend/               # React Native (Expo) Mobile App
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React Context for state management
    │   ├── pages/          # Screen components
    │   ├── services/       # API, location, socket services
    │   └── app/            # Expo Router entry point
    └── android/            # Android-specific configuration
```

### Data Model

**User Entity**

```typescript
{
  id: number;
  username: string (unique);
  password: string (hashed with bcrypt);
  profile_image?: string;
}
```

**Incident Entity**

```typescript
{
  id: number;
  lat: decimal;
  lon: decimal;
  type: string;
  severity: string;
  description?: string;
  image?: string;
  address?: string (reverse geocoded);
  reportCount: number (default: 1);
  resolveCount: number (default: 0);
  reportedBy: User (foreign key);
  createdAt: timestamp;
}
```

**Vote Entity**

```typescript
{
  id: number;
  incident: Incident;
  voteType: "report" | "resolve";
  votedBy: User;
}
```

## Development

### Running Tests

**Backend Unit Tests:**

```bash
cd backend
npm test
```

**Backend Test Coverage:**

```bash
cd backend
npm run test:cov
```

**Backend E2E Tests:**

```bash
cd backend
npm run test:e2e
```

### Code Quality

**Lint Backend:**

```bash
cd backend
npm run lint
```

**Lint Frontend:**

```bash
cd frontend
npm run lint
```

**Format Code:**

```bash
cd backend
npm run format
```

### Building for Production

**Backend:**

```bash
cd backend
npm run build
npm run start:prod
```

**Frontend (APK for Android):**

```bash
cd frontend
eas build --platform android
```

## Important Notes

⚠️ **Development vs Production**

- The backend currently uses `TypeORM synchronize: true` for convenient development. This should be replaced with proper database migrations before deploying to production.
- The hardcoded backend URL in frontend services must be updated for different network environments.
- JWT_SECRET should be changed to a strong, random value in production.

🔐 **Security Considerations**

- All incident routes require JWT authentication
- WebSocket connections should be authenticated in production
- Password hashing uses bcrypt with default salt rounds
- Sensitive environment variables must be managed securely

## Future Enhancements

- [ ] AI-powered incident insights and pattern detection
- [ ] Multi-language support
- [ ] Incident filtering and search capabilities
- [ ] User reputation/karma system
- [ ] Incident image attachments (currently unused)
- [ ] Advanced analytics dashboard
- [ ] Push notification scheduling
- [ ] Incident categories and subcategories

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure all tests pass and code follows the project's linting standards before submitting a PR.

## License

This project is licensed under the UNLICENSED license. See the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.
