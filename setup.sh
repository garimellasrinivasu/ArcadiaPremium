#!/bin/bash
set -e

# Resolve the project root as an absolute path
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=============================================="
echo "  ArcadiaPremium — Environment Setup (macOS)  "
echo "=============================================="
echo ""

# -----------------------------------------------
# 1. Homebrew
# -----------------------------------------------
if ! command -v brew &>/dev/null; then
  echo ">> Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✓ Homebrew already installed"
fi

# -----------------------------------------------
# 2. Git
# -----------------------------------------------
if ! command -v git &>/dev/null; then
  echo ">> Installing Git..."
  brew install git
else
  echo "✓ Git already installed ($(git --version))"
fi

# -----------------------------------------------
# 3. Node.js (LTS)
# -----------------------------------------------
if ! command -v node &>/dev/null; then
  echo ">> Installing Node.js..."
  brew install node
else
  echo "✓ Node.js already installed ($(node --version))"
fi

# -----------------------------------------------
# 4. Java 21 (Temurin)
# -----------------------------------------------
if ! command -v java &>/dev/null || ! java -version 2>&1 | grep -q "21"; then
  echo ">> Installing Java 21 (Eclipse Temurin)..."
  brew install --cask temurin@21
else
  echo "✓ Java 21 already installed"
fi

# -----------------------------------------------
# 5. Maven
# -----------------------------------------------
if ! command -v mvn &>/dev/null; then
  echo ">> Installing Maven..."
  brew install maven
else
  echo "✓ Maven already installed ($(mvn --version | head -1))"
fi

# -----------------------------------------------
# 6. PostgreSQL
# -----------------------------------------------
if ! command -v psql &>/dev/null; then
  echo ">> Installing PostgreSQL..."
  brew install postgresql@16
  brew services start postgresql@16
  echo "   Waiting for PostgreSQL to start..."
  sleep 3
else
  echo "✓ PostgreSQL already installed"
  brew services start postgresql@16 2>/dev/null || true
fi

# Create database and user
echo ">> Setting up database..."
psql postgres -c "CREATE USER arcadia WITH PASSWORD 'arcadia123';" 2>/dev/null || echo "   (user 'arcadia' already exists)"
psql postgres -c "CREATE DATABASE arcadia_premium OWNER arcadia;" 2>/dev/null || echo "   (database 'arcadia_premium' already exists)"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE arcadia_premium TO arcadia;" 2>/dev/null || true

# -----------------------------------------------
# 7. VS Code
# -----------------------------------------------
if ! command -v code &>/dev/null; then
  echo ">> Installing Visual Studio Code..."
  brew install --cask visual-studio-code
else
  echo "✓ VS Code already installed"
fi

# Install recommended extensions
echo ">> Installing VS Code extensions..."
code --install-extension dbaeumer.vscode-eslint 2>/dev/null || true
code --install-extension esbenp.prettier-vscode 2>/dev/null || true
code --install-extension bradlc.vscode-tailwindcss 2>/dev/null || true
code --install-extension vscjava.vscode-java-pack 2>/dev/null || true
code --install-extension vmware.vscode-spring-boot 2>/dev/null || true
code --install-extension eamodio.gitlens 2>/dev/null || true

# -----------------------------------------------
# 8. Install frontend dependencies
# -----------------------------------------------
echo ""
echo ">> Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install

# -----------------------------------------------
# 9. Build backend (download deps)
# -----------------------------------------------
echo ""
echo ">> Downloading backend dependencies..."
cd "$PROJECT_DIR/backend"
mvn dependency:resolve -q

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "  To start developing:"
echo ""
echo "  1. Open in VS Code:"
echo "     code "$PROJECT_DIR""
echo ""
echo "  2. Start the backend:"
echo "     cd backend && mvn spring-boot:run"
echo ""
echo "  3. Start the frontend (new terminal):"
echo "     cd frontend && npm run dev"
echo ""
echo "  4. Open http://localhost:3000"
echo "     Login: admin@arcadiapremium.com / admin123"
echo ""
echo "=============================================="
