#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

packages=(php-cli php-mysql php-curl php-mbstring php-xml php-zip default-mysql-client unzip curl acl)
missing=()
for package in "${packages[@]}"; do
  dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q 'install ok installed' || missing+=("$package")
done
if ((${#missing[@]})); then
  sudo apt-get update
  sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${missing[@]}"
fi
if [[ ! -x /usr/local/bin/wp ]]; then
  download=$(mktemp)
  trap 'rm -f "$download"' EXIT
  curl --fail --silent --show-error --location https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar -o "$download"
  php "$download" --info
  sudo install -m 755 "$download" /usr/local/bin/wp
fi
wp --info
# npm install is incremental and retains the lockfile's existing dependency versions.
npm install --include=dev
node node_modules/playwright-core/cli.js install --with-deps chromium

# ACLs cover the CLI user and Apache without changing core ownership. Defaults
# let files created by either writer remain writable by the other.
wp_root=${FACTORY_WP_ROOT:-/wordpress}
for directory in "$wp_root/wp-content/plugins" "$wp_root/wp-content/uploads" "$wp_root/wp-content/upgrade"; do
  sudo mkdir -p "$directory"
  sudo setfacl -R -m "u:$(id -u):rwX,u:www-data:rwX" "$directory"
  sudo find "$directory" -type d -exec setfacl -m "d:u:$(id -u):rwx,d:u:www-data:rwx" {} +
done
# Fresh app containers do not inherit the wordpress service's nested bind mount.
# Resolve the theme through /workspace here as well; never replace real content.
theme="$wp_root/wp-content/themes/mwstudios-wordpress-factory"
if [[ ! -L "$theme" ]]; then
  if [[ -d "$theme" ]] && ! mountpoint -q "$theme"; then
    sudo rmdir "$theme" # Refuse to replace a nonempty theme directory.
  fi
  if [[ ! -e "$theme" ]]; then sudo ln -s /workspace "$theme"; fi
fi
printf '%s\n' 'Codespaces tools ready. After WordPress installation: npm run factory:codespaces:bootstrap'

export PATH="$HOME/.local/bin:$PATH"

if ! command -v codex >/dev/null 2>&1; then
    echo "Installing Codex CLI..."
    curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
else
    echo "Codex CLI already installed."
fi

echo "Codex CLI:"
codex --version