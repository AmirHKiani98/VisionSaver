#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create and activate virtual environment
python -m venv "$SCRIPT_DIR/.venv"

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source "$SCRIPT_DIR/.venv/Scripts/activate"
else
    source "$SCRIPT_DIR/.venv/bin/activate"
fi

# Install requirements
pip install -r "$SCRIPT_DIR/requirements.txt"
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# Install frontend packages
cd "$SCRIPT_DIR/cameravision" || exit
echo "Installing frontend packages..."

npm install

echo "Installation completed successfully!"