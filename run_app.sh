#!/bin/bash

# Activate virtual environment
source .venv/Scripts/activate

# Navigate to the cameravision directory
cd cameravision || exit

# Run the development script using npm
npm run dev