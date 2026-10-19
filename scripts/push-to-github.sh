#!/usr/bin/env bash
set -e

# ==============================================================================
# Dqua Donate — GitHub Push Helper Script
# Gunakan skrip ini untuk mendorong (push) seluruh kode Dqua Donate ke GitHub Anda
# ==============================================================================

echo "=========================================="
echo "   Dqua Donate — Sinkronisasi GitHub      "
echo "=========================================="

REPO_URL="$1"
PAT_TOKEN="$2"

if [ -z "$REPO_URL" ]; then
  read -p "Masukkan URL Repositori GitHub (misal: https://github.com/USERNAME/REPO.git): " REPO_URL
fi

if [ -z "$REPO_URL" ]; then
  echo "Error: URL Repositori tidak boleh kosong."
  exit 1
fi

# Jika token dimasukkan, gunakan token dalam URL
if [ -n "$PAT_TOKEN" ]; then
  # Bersihkan https:// jika ada
  CLEAN_URL=$(echo "$REPO_URL" | sed 's|https://||')
  REMOTE_AUTH_URL="https://${PAT_TOKEN}@${CLEAN_URL}"
else
  read -s -p "Masukkan GitHub Personal Access Token (PAT): " PAT_TOKEN
  echo ""
  CLEAN_URL=$(echo "$REPO_URL" | sed 's|https://||')
  REMOTE_AUTH_URL="https://${PAT_TOKEN}@${CLEAN_URL}"
fi

# Set remote origin
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_AUTH_URL"

echo "Memverifikasi branch 'main'..."
git branch -M main

echo "Mendorong perubahan ke GitHub..."
git push -u origin main --force

# Hapus token dari konfigurasi remote setelah selesai demi keamanan
git remote set-url origin "$REPO_URL"

echo ""
echo "=========================================="
echo " Berhasil! Kode Dqua Donate terdorong ke:"
echo " $REPO_URL"
echo "=========================================="
