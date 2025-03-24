#!/bin/bash

# Create folders if they don't exist
mkdir -p css js

# Download Bootstrap CSS
echo "Downloading Bootstrap CSS..."
curl -o css/bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css

# Download Bootstrap JS
echo "Downloading Bootstrap JS..."
curl -o js/bootstrap.bundle.min.js https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js

echo "✅ Bootstrap files downloaded successfully!"
