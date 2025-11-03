#!/bin/bash
# ParrotOrganizer Launcher (Linux/Mac)
# This script starts a local web server and opens the app

echo "========================================"
echo "  ParrotOrganizer - TeknoParrot Manager"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo ""
    echo "Please install Python 3"
    exit 1
fi

echo "Starting local web server..."
echo ""
echo "ParrotOrganizer is running at:"
echo "http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server when done."
echo "========================================"
echo ""

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000
elif command -v open &> /dev/null; then
    open http://localhost:8000
fi

# Start Python HTTP server
python3 -m http.server 8000
