#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗] ERROR: $1${NC}"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DOMAIN="gsdev.qzz.io"
LOG_DIR="/var/log/cloudwatch-pro"
NGINX_CONF="/etc/nginx/sites-available/cloudwatch-pro"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║    CloudWatch Pro — Server Setup     ║"
echo "╚══════════════════════════════════════╝"
echo ""
info "Repo directory : $REPO_DIR"
info "Domain         : $DOMAIN"
echo ""

# ── Step 0: Fix ownership (handles case where repo was cloned with sudo) ──
log "Fixing directory ownership to current user ($USER)..."
sudo chown -R "$USER":"$USER" "$REPO_DIR"

# ── Step 1: Node.js ────────────────────────────────────────────────────────
if command -v node &>/dev/null; then
  log "Node.js already installed: $(node --version)"
else
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || err "Failed to add NodeSource repo"
  sudo apt-get install -y nodejs || err "Failed to install Node.js"
  log "Node.js installed: $(node --version)"
fi

# ── Step 2: PM2 ────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null; then
  log "PM2 already installed"
else
  log "Installing PM2..."
  sudo npm install -g pm2 || err "Failed to install PM2"
fi

# ── Step 3: nginx ──────────────────────────────────────────────────────────
if command -v nginx &>/dev/null; then
  log "nginx already installed"
else
  log "Installing nginx..."
  sudo apt-get install -y nginx || err "Failed to install nginx"
fi

# ── Step 4: Log directory ──────────────────────────────────────────────────
log "Creating log directory..."
sudo mkdir -p "$LOG_DIR"
sudo chown "$USER":"$USER" "$LOG_DIR"

# ── Step 5: Check .env ─────────────────────────────────────────────────────
if [ ! -f "$REPO_DIR/backend/.env" ]; then
  warn ".env file not found — creating from template..."
  cp "$REPO_DIR/backend/.env.example" "$REPO_DIR/backend/.env"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  warn " Please fill in your secrets in the .env file now:"
  info "   nano $REPO_DIR/backend/.env"
  echo ""
  warn " You need these 4 values:"
  warn "   JWT_SECRET       — any random 32+ character string"
  warn "   GROQ_API_KEY     — from console.groq.com (free)"
  warn "   TURSO_URL        — from turso.tech (free)"
  warn "   TURSO_AUTH_TOKEN — from turso.tech (free)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  read -rp "Press ENTER after saving .env to continue..."
fi

# Verify required env values are set
source "$REPO_DIR/backend/.env"
[ -z "$JWT_SECRET"        ] && err "JWT_SECRET is empty in .env"
[ -z "$TURSO_URL"         ] && err "TURSO_URL is empty in .env"
[ -z "$TURSO_AUTH_TOKEN"  ] && err "TURSO_AUTH_TOKEN is empty in .env"
[ -z "$GROQ_API_KEY"      ] && err "GROQ_API_KEY is empty in .env"
log ".env looks good"

# ── Step 6: Backend dependencies ───────────────────────────────────────────
log "Installing backend dependencies..."
cd "$REPO_DIR/backend" || err "Cannot enter backend directory"
npm install --omit=dev || err "Backend npm install failed"
log "Backend dependencies installed"

# ── Step 7: Build frontend ─────────────────────────────────────────────────
log "Installing frontend dependencies..."
cd "$REPO_DIR/frontend" || err "Cannot enter frontend directory"
npm install || err "Frontend npm install failed"

log "Building frontend for production..."
npm run build || err "Frontend build failed"
log "Frontend built → $REPO_DIR/frontend/dist"

# ── Step 8: nginx config ───────────────────────────────────────────────────
log "Configuring nginx..."
sudo cp "$REPO_DIR/deploy/nginx.conf" "$NGINX_CONF"
sudo sed -i "s|/opt/CloudWatch_Pro|$REPO_DIR|g" "$NGINX_CONF"
sudo sed -i "s|gsdev.qzz.io|$DOMAIN|g" "$NGINX_CONF"

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/cloudwatch-pro
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t || err "nginx config is invalid — check $NGINX_CONF"
sudo systemctl enable nginx
sudo systemctl restart nginx
log "nginx running ✓"

# ── Step 9: Start backend with PM2 ─────────────────────────────────────────
log "Starting backend with PM2..."
cd "$REPO_DIR/backend" || err "Cannot enter backend directory"

pm2 delete cloudwatch-pro 2>/dev/null || true

pm2 start server.js \
  --name cloudwatch-pro \
  --log    "$LOG_DIR/out.log" \
  --error  "$LOG_DIR/error.log" \
  --time \
  -- 2>/dev/null

pm2 save

# ── Step 10: PM2 auto-start on reboot ──────────────────────────────────────
log "Enabling PM2 auto-start on boot..."
STARTUP_CMD=$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>&1 | grep "sudo")
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD"
  log "PM2 startup configured"
fi

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════╗"
echo "║        Setup Complete! ✓               ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "  Backend health → curl http://localhost:3000/api/health"
echo "  App URL        → https://$DOMAIN"
echo ""
echo "  PM2 commands:"
echo "    pm2 status                   — check if running"
echo "    pm2 logs cloudwatch-pro      — live logs"
echo "    pm2 restart cloudwatch-pro   — restart after changes"
echo ""
warn "Login with: admin / admin123 — change it after first login!"
echo ""
