cd cameravision
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    rmdir /s /q node_modules 2>/dev/null
else
    rm -rf node_modules 2>/dev/null
fi
npm install --legacy-peer-deps
cd ..
if command -v python3.10 >/dev/null 2>&1; then
    echo "Python 3.10 is already installed."
else
    echo "Python 3.10 not found. Installing..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        choco install python --version=3.10.0 -y
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install python@3.10
    else
        sudo apt-get update
        sudo apt-get install -y python3.10
    fi
fi
python3.10 -m venv .venv
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    . .venv/Scripts/Activate
else
    source .venv/bin/activate
fi

pip install -r requirements.txt
