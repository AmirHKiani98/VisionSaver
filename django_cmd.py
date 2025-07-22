#!/usr/bin/env python
"""
Wrapper script to run Django commands from the correct directory.
This solves the module import issues by running from the project root.
"""
import os
import sys
import subprocess

def main():
    # Get the directory where this script is located (project root)
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    # Change to project root directory
    os.chdir(project_root)
    
    # Build the command: python backend/manage.py [args...]
    cmd = [sys.executable, "backend/manage.py"] + sys.argv[1:]
    
    # Run the Django command
    try:
        result = subprocess.run(cmd, check=True)
        sys.exit(result.returncode)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
    except KeyboardInterrupt:
        sys.exit(1)

if __name__ == "__main__":
    main()
