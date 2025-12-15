import os
import subprocess
import sys
import platform
import site
# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

venv_path = os.path.join(SCRIPT_DIR, ".venv")
# Check if venv already exists
if not os.path.isdir(venv_path):
    subprocess.run([sys.executable, "-m", "venv", venv_path], check=True)
    print("Creating virtual environment...")

DEBUG = True

shell = True
if platform.system() == "Windows":
    activate_script = os.path.join(venv_path, "Scripts", "activate.bat")
    pip_cmd = f"{activate_script} && pip install -r {os.path.join(SCRIPT_DIR, 'requirements.txt')}"
else:
    activate_script = "source " + os.path.join(venv_path, "bin", "activate")
    shell = True
    pip_cmd = f"{activate_script} && pip install -r {os.path.join(SCRIPT_DIR, 'requirements.txt')}"
print("Retrieving requirements.txt...")
if DEBUG:
    subprocess.run(pip_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True)

else:
    subprocess.run(pip_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

site_packages_path = os.path.join(venv_path, "Lib", "site-packages")  # Windows

sys.path.insert(0, site_packages_path)


# There are couple of libraries in .venv/Scripts/lib that should be included in this script.
# We are not running this script after activating the venv, so we need to ensure these libraries are available.

import requests
# Ensure required libraries are installed in the virtual environment

from bs4 import BeautifulSoup  # type: ignore
url = "https://pytorch.org/get-started/previous-versions/"
html = requests.get(url).text
# Check if url is opened
if requests.get(url).status_code == 200:
    pytorch_versions_html_found = True
    print("Pytorch Previous Versions URL accessed successfully")
else:
    pytorch_versions_html_found = False
    print("Failed to access Pytorch Previous Versions URL")

# Grab Cuda version from nvidia-smi command, if available

import subprocess
import re
cuda_exists= False
# Run the nvidia-smi command and capture the output
try:
    result = subprocess.run(['nvidia-smi'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    output = result.stdout

    # Use regex to find the CUDA version
    match = re.search(r'CUDA Version: (\d+\.\d+)', output)
    if match:
        cuda_version = float(match.group(1))
        cuda_exists= True
        print(f"Detected CUDA version: {cuda_version}")
    else:
        print("CUDA version not found in nvidia-smi output.")
except subprocess.CalledProcessError as e:
    print(f"Error running nvidia-smi: {e.stderr}")



if pytorch_versions_html_found and cuda_exists:
    soup = BeautifulSoup(html, features="html.parser")
    pytorch_versions = {}
    # Find all versions that are like this:
    # first <h5 id="linux-and-windows">...</h5> appears
    # although this calls id, it actually appears more than once
    # then find the next siblings that is <div class="language-plaintext highlighter-rouge"><div class="highlight"><pre>...</pre></div></div>
    # we want the content of <pre>...</pre>
    for h3 in soup.find_all("h3", id="v260"):
        # get h3 text:
        version_key = h3.get_text().strip()
        pytorch_versions[version_key] = {}
        # h5 is not the exact next sibling. We only want the first sibling that matches this
        for h5 in h3.find_next_siblings("h5", id="linux-and-windows"):
            next_sibling = h5.find_next_sibling("div", class_="language-plaintext highlighter-rouge")
            if next_sibling:
                pre = next_sibling.find("pre")
                if pre:
                    versions_info = pre.get_text().strip()
                    # read line by line. odd lines are the keys and even lines are the values
                    lines = versions_info.split("\n")
                    print(versions_info)
                    for i in range(0, len(lines), 2):
                        key = lines[i].strip()
                        key = key.strip("#")  # remove trailing colon
                        key = key.strip()  # remove trailing colon
                        if i + 1 < len(lines):
                            value = lines[i + 1].strip()
                            pytorch_versions[version_key][key] = value
            break

# Find the closest matching Cuda version
def find_compatible_pytorch_version(cuda_available=False, cuda_version=None):
    # sort the pytorch_versions keys in descending order
    sorted_versions = dict(sorted(pytorch_versions.items(), key= lambda x: x[0], reverse=True))
    if not cuda_available:
        for pytorch_version in sorted_versions.keys():
            for version, command in sorted_versions[pytorch_version].items():
                if "CPU" in version:
                    print(f"CPU-only version found in PyTorch version {pytorch_version}")
                    return version, command
    else:
        for pytorch_version in sorted_versions.keys():
            print(f"Checking PyTorch version: {pytorch_version}")
            for version, command in sorted_versions[pytorch_version].items():
                
                if cuda_available and f"CUDA {cuda_version}" in version:
                    print(f"Exact match found for CUDA {cuda_version} in PyTorch version {pytorch_version}")
                    return version, command
        # We haven't found an exact match, so find the closest lower version
        for pytorch_version in sorted_versions.keys():
            for version, command in sorted_versions[pytorch_version].items():
                if not "CUDA" in version:
                    continue
                versions_in_key = float(version.split(" ")[-1])
                
                if versions_in_key < cuda_version:
                    print(f"Closest match found for CUDA {versions_in_key} in PyTorch version {pytorch_version}")
                    return version, command
    return None, None

pytorch_version, install_command = find_compatible_pytorch_version(cuda_exists, cuda_version)
if install_command:
    print(f"Recommended PyTorch version: {pytorch_version}")
    print(f"Retriveing pytorch command: {install_command}")




if install_command:
    torch_cmd = f"{activate_script} && {install_command}"
    print("Checking pytorch availability...")
    if DEBUG:
        subprocess.run(torch_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True)
    else:
        subprocess.run(torch_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


print("Retrieving necessary information process completed successfully!")


# Retrive frontend packages
frontend_dir = os.path.join(SCRIPT_DIR, "cameravision")
if os.path.isdir(frontend_dir):
    npm_install_cmd = f"{activate_script} && cd {frontend_dir} && npm install"
    if DEBUG:
        subprocess.run(npm_install_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True)
    else:
        subprocess.run(npm_install_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
else:
    print(f"Frontend directory not found: {frontend_dir}")

print("Starting the tool ...")
if os.path.isdir(frontend_dir):
    npm_build_cmd = f"{activate_script} && cd {frontend_dir} && npm run dev"
    if DEBUG:
        subprocess.run(npm_build_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True)
    else:
        subprocess.run(npm_build_cmd, shell=shell, executable=None if not platform.system() == "Windows" else None, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)





            

