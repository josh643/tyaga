#!/bin/bash
set -e

# Update System
sudo apt update && sudo apt upgrade -y

# 1. Setup Swap (4GB) - Essential for 2GB RAM VPS
if [ ! -f /swapfile ]; then
    echo "Creating 4GB Swap File..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap created."
else
    echo "Swap file already exists."
fi

# 2. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed."
else
    echo "Docker already installed."
fi

# 3. Adjust vm.max_map_count (often needed for databases/elastic)
sudo sysctl -w vm.max_map_count=262144
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf

# 4. Add SSH Key
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIqeZIz4z7bp5wCdjmg0d1rqWPv5NWe0f2MHfnwYVBxi josh@elderworldsstudio.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo "SSH Key added."

echo "Setup Complete! Please log out and log back in for Docker group changes to take effect."
