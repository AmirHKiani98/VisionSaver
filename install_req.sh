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

# Check if NVIDIA GPU is available
if command -v nvidia-smi &> /dev/null; then
    echo "GPU detected. Installing PyTorch with CUDA support..."
    pip uninstall torch torchvision -y
    pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu126
else
    echo "No GPU detected. Skipping PyTorch GPU installation."
fi

# Install frontend packages
cd "$SCRIPT_DIR/cameravision" || exit
echo "Installing frontend packages..."
export ELECTRON_SKIP_BINARY_DOWNLOAD=1
npm install --no-optional

echo "Installation completed successfully!"