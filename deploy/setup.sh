#!/bin/bash
set -e

REPO_DIR="/opt/CloudWatch_Pro"
DOMAIN="gsdev.qzz.io"
LOG_DIR="/var/log/cloudwatch-pro"
NGINX_CONF="/etc/nginx/sites-available/cloudwatch-pro"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

echo ""
echo "╔══════════════════════════════════╗"
echo "║   CloudWatch Pro — Server Setup  ║"
echo "╚══════════════════════════════════╝"
echo ""

log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

log "Installing PM2 globally..."
sudo npm install -g pm2

log "Installing nginx..."
sudo apt-get install -y nginx

log "Creating log directory..."
sudo mkdir -p $LOG_DIR
sudo chown $USER:$USER $LOG_DIR

log "Installing backend dependencies..."
cd $REPO_DIR/backend
npm install --omit=dev

log "Checking backend .env..."
if [ ! -f "$REPO_DIR/backend/.env" ]; then
  warn ".env not found — copying from .env.example"
  cp $REPO_DIR/backend/.env.example $REPO_DIR/backend/.env
  warn "IMPORTANT: Edit $REPO_DIR/backend/.env and fill in your secrets before starting!"
  warn "  - JWT_SECRET (random 64 char string)"
  warn "  - GROQ_API_KEY"
  warn "  - TURSO_URL"
  warn "  - TURSO_AUTH_TOKEN"
  warn "  - CORS_ORIGIN=https://$DOMAIN"
fi

log "Building frontend..."
cd $REPO_DIR/frontend
npm install
npm run build
log "Frontend built → $REPO_DIR/frontend/dist"

log "Setting up nginx..."
sudo cp $REPO_DIR/deploy/nginx.conf $NGINX_CONF
sudo sed -i "s|/opt/CloudWatch_Pro|$REPO_DIR|g" $NGINX_CONF
sudo sed -i "s|gsdev.qzz.io|$DOMAIN|g" $NGINX_CONF
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/cloudwatch-pro
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
log "nginx configured for $DOMAIN"

log "Copying PM2 ecosystem config..."
cp $REPO_DIR/deploy/ecosystem.config.cjs $REPO_DIR/backend/
sudo sed -i "s|/opt/CloudWatch_Pro|$REPO_DIR|g" $REPO_DIR/backend/ecosystem.config.cjs
sudo sed -i "s|/var/log/cloudwatch-pro|$LOG_DIR|g" $REPO_DIR/backend/ecosystem.config.cjs

log "Starting backend with PM2..."
cd $REPO_DIR/backend
pm2 start ecosystem.config.cjs
pm2 save

log "Enabling PM2 on system startup..."
pm2 startup | tail -1 | sudo bash || true

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         Setup Complete! ✓            ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  App URL  → https://$DOMAIN"
echo "  API test → https://$DOMAIN/api/health"
echo ""
echo "  PM2 commands:"
echo "    pm2 status                    — check status"
echo "    pm2 logs cloudwatch-pro       — view logs"
echo "    pm2 restart cloudwatch-pro    — restart backend"
echo ""
warn "Don't forget to edit $REPO_DIR/backend/.env with your real secrets!"
echo ""
