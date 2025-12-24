#!/bin/bash
set -e

# Overdrip installer script
# Downloads and installs the Overdrip CLI from GitHub releases

REPO="sleb/od"
BINARY_NAME="overdrip"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
VERSION="${VERSION:-}"  # Override with VERSION=x.y.z or VERSION=dev-abc123
SERVICE_USER=""
SERVICE_HOME=""
CONFIG_PATH=""
SERVICE_PATH=""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}ℹ${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1" >&2
}

log_warn() {
  echo -e "${YELLOW}!${NC} $1"
}

log_step() {
  echo -e "${YELLOW}→${NC} $1"
}

# Detect OS
detect_os() {
  case "$(uname -s)" in
    Linux*)     echo "linux" ;;
    Darwin*)    echo "macos" ;;
    MINGW*)     echo "windows" ;;
    *)          echo "unknown" ;;
  esac
}

# Detect architecture
detect_arch() {
  case "$(uname -m)" in
    x86_64)     echo "x86_64" ;;
    amd64)      echo "x86_64" ;;
    arm64)      echo "arm64" ;;
    aarch64)    echo "arm64" ;;
    armv7l)     echo "armv7" ;;
    *)          echo "unknown" ;;
  esac
}

require_systemd() {
  if ! command -v systemctl >/dev/null 2>&1; then
    log_error "systemd is required (only systemd-based Linux is supported right now)"
    exit 1
  fi

  local init
  init=$(ps -p 1 -o comm= 2>/dev/null || true)
  if [ "$init" != "systemd" ]; then
    log_error "This system is not running systemd (init: $init). Supported: systemd only."
    exit 1
  fi
}

run_as_service_user() {
  if [ -z "$SERVICE_USER" ] || [ -z "$SERVICE_HOME" ]; then
    log_error "SERVICE_USER or SERVICE_HOME not set"
    exit 1
  fi

  # No need for sudo - we're already running as the service user
  env HOME="$SERVICE_HOME" "$@"
}

ensure_config() {
  if [ -f "$CONFIG_PATH" ]; then
    log_info "Config already exists at $CONFIG_PATH"
    return 0
  fi

  log_step "Initializing config at $CONFIG_PATH"
  if ! run_as_service_user "$INSTALL_DIR/$BINARY_NAME" init --path "$CONFIG_PATH"; then
    log_error "Failed to initialize config"
    exit 1
  fi
}

# Get latest stable release version (excludes pre-releases)
get_latest_version() {
  local version
  version=$(curl -sSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name": "v?([^"]+)".*/\1/')

  if [ -z "$version" ]; then
    log_error "Could not determine latest stable version"
    exit 1
  fi

  echo "$version"
}

setup_systemd_service() {
  log_step "Creating systemd user service for '$SERVICE_USER'"

  local user_service_dir="$SERVICE_HOME/.config/systemd/user"

  if [ ! -d "$user_service_dir" ]; then
    log_step "Creating user service directory $user_service_dir"
    mkdir -p "$user_service_dir"
  fi

  SERVICE_PATH="$user_service_dir/${BINARY_NAME}.service"

  cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=Overdrip plant watering CLI
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=NODE_ENV=production
ExecStart=$INSTALL_DIR/$BINARY_NAME start --path $CONFIG_PATH
Restart=on-failure
RestartSec=5s
WorkingDirectory=$SERVICE_HOME
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

  log_step "Reloading systemd user units"
  systemctl --user daemon-reload

  log_step "Enabling user service $BINARY_NAME"
  systemctl --user enable "$BINARY_NAME"

  log_step "Starting user service $BINARY_NAME"
  systemctl --user restart "$BINARY_NAME"

  log_step "Enabling linger for $SERVICE_USER (keeps service running after logout)"
  loginctl enable-linger "$SERVICE_USER"

  log_info "User service installed: systemctl --user status $BINARY_NAME"
}

# Verify binary works
verify_installation() {
  local binary_path="$INSTALL_DIR/$BINARY_NAME"

  if [ ! -f "$binary_path" ]; then
    log_error "$BINARY_NAME not found at $binary_path"
    return 1
  fi

  if [ ! -x "$binary_path" ]; then
    log_error "$BINARY_NAME is not executable"
    return 1
  fi

  return 0
}

# Main installation
main() {
  log_info "Installing Overdrip CLI (systemd Linux only)"

  # Detect system
  OS=$(detect_os)
  ARCH=$(detect_arch)

  if [ "$OS" = "unknown" ] || [ "$ARCH" = "unknown" ]; then
    log_error "Unsupported system: $OS/$ARCH"
    exit 1
  fi

  log_step "Detected system: $OS/$ARCH"

  # Construct binary name
  BINARY_FILENAME="$BINARY_NAME-$OS-$ARCH"

  # Get version
  if [ -z "$VERSION" ]; then
    log_step "Fetching latest stable release..."
    VERSION=$(get_latest_version)
    log_info "Latest stable version: $VERSION"
  else
    log_info "Installing version: $VERSION"
  fi

  # Download URL
  DOWNLOAD_URL="https://github.com/$REPO/releases/download/$VERSION/$BINARY_FILENAME.gz"

  # Ensure install directory exists
  if [ ! -d "$INSTALL_DIR" ]; then
    log_step "Creating install directory $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
  fi

  # Check PATH and warn if needed
  if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    log_warn "$INSTALL_DIR is not in your PATH"
    log_warn "Add this to your shell profile: export PATH=\"\$PATH:$INSTALL_DIR\""
  fi

  # Download binary
  log_step "Downloading $BINARY_FILENAME.gz..."

  if ! curl -fL --progress-bar "$DOWNLOAD_URL" | gunzip > "$INSTALL_DIR/$BINARY_NAME"; then
    log_error "Failed to download or decompress $BINARY_FILENAME from $DOWNLOAD_URL"
    log_error "Make sure the release exists on GitHub"
    exit 1
  fi

  # Make executable
  chmod +x "$INSTALL_DIR/$BINARY_NAME"

  # systemd setup
  if [ "$OS" = "linux" ]; then
    require_systemd
    SERVICE_USER="$(whoami)"
    SERVICE_HOME="$HOME"
    CONFIG_PATH="$SERVICE_HOME/.overdrip/config.json"

    ensure_config
    setup_systemd_service
  else
    log_error "Only systemd-based Linux is supported for now"
    exit 1
  fi

  # Verify installation
  log_step "Verifying installation..."

  if verify_installation; then
    log_info "Successfully installed $BINARY_NAME $VERSION"
    log_info "Service is running and will persist across reboots and logouts"
    log_info "Check service status: systemctl --user status $BINARY_NAME"
    log_info "View logs: journalctl --user -u $BINARY_NAME -f"
    log_info "Config file: $CONFIG_PATH"
    echo ""
    log_info "To install a specific version: VERSION=0.2.0 ./install.sh"
    log_info "To install a dev release: VERSION=dev-abc123 ./install.sh"
  else
    log_error "Installation verification failed"
    rm -f "$INSTALL_DIR/$BINARY_NAME"
    exit 1
  fi
}

main "$@"
