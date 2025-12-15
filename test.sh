# Cuda versions available
cuda_version=$(nvidia-smi | grep -oP 'CUDA Version: \K\d+\.\d+')

# Check 