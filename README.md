# ArcadiaPremium

Full-stack real estate management platform built with **React 18**, **Spring Boot 3**, and **PostgreSQL**.

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18 + Vite + TypeScript + Tailwind CSS   |
| Backend   | Spring Boot 3.3 + Spring Security + JWT       |
| Database  | PostgreSQL 16                                 |
| Build     | npm (frontend) · Maven (backend)              |

## Quick Start

### 1. Run the setup script (installs everything)

```sh
cd ArcadiaPremium
chmod +x setup.sh
./setup.sh
```

This installs: Homebrew, Git, Node.js, Java 21, Maven, PostgreSQL, VS Code, and all project dependencies.

### 2. Start the backend

```sh
cd backend
mvn spring-boot:run
```

The API starts at **http://localhost:8080**.

### 3. Start the frontend

```sh
cd frontend
npm run dev
```

The app opens at **http://localhost:3000**.

### 4. Login

- Email: `admin@arcadiapremium.com`
- Password: `admin123`

## Project Structure

```
ArcadiaPremium/
├── frontend/                  React application
│   ├── src/
│   │   ├── components/        Reusable UI components
│   │   ├── pages/             Route-level pages
│   │   ├── services/          API client & service layer
│   │   └── types/             TypeScript interfaces
│   └── package.json
├── backend/                   Spring Boot application
│   ├── src/main/java/com/arcadia/premium/
│   │   ├── config/            Security & app config
│   │   ├── controller/        REST endpoints
│   │   ├── dto/               Data transfer objects
│   │   ├── model/             JPA entities
│   │   ├── repository/        Data access layer
│   │   ├── security/          JWT auth filters
│   │   └── service/           Business logic
│   └── pom.xml
├── setup.sh                   One-click environment setup
└── README.md
```

## API Endpoints

| Method | Endpoint          | Description       | Auth     |
|--------|-------------------|-------------------|----------|
| POST   | /api/auth/login   | Login (get JWT)   | Public   |
| GET    | /api/auth/me      | Current user info | Bearer   |
| GET    | /api/users        | List all users    | ADMIN    |
| POST   | /api/users        | Create user       | ADMIN    |
| PUT    | /api/users/:id    | Update user       | ADMIN    |
| DELETE | /api/users/:id    | Delete user       | ADMIN    |
| GET    | /api/roles        | List all roles    | ADMIN    |

## GitHub Setup

```sh
cd ArcadiaPremium

# Initialize repo
git init
git add .
git commit -m "Initial commit — ArcadiaPremium project scaffold"

# Create repo on GitHub (via browser or gh CLI), then:
git remote add origin https://github.com/YOUR_USERNAME/ArcadiaPremium.git
git branch -M main
git push -u origin main
```

If you have the GitHub CLI (`brew install gh`):

```sh
gh repo create ArcadiaPremium --private --source=. --remote=origin --push
```
