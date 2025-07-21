import wmi
import subprocess
import time
# Create your tests here
# .
def set_tunnel_type_ikve2(vpn_name):
    """Force the VPN connection to use IKEv2 protocol."""
    cmd = f'Set-VpnConnection -Name "{vpn_name}" -TunnelType IKEv2 -Force'
    subprocess.run(['powershell', '-Command', cmd], capture_output=True)

def connect_vpn_wmi(vpn_name):
    c = wmi.WMI()
    print(f"Checking existing VPN connections for '{vpn_name}'...")
    for conn in c.Win32_NetworkConnection():
        print(f"Checking connection: {conn.Name}")
        if vpn_name.lower() in conn.Name.lower():
            print(f"VPN '{vpn_name}' already connected.")
            return True
    print(f"Setting VPN '{vpn_name}' to use IKEv2 protocol.")
    set_tunnel_type_ikve2(vpn_name)
    
    command = ['rasdial', vpn_name]
    print(f"Connecting to VPN '{vpn_name}' with command: {' '.join(command)}")
    start_time = time.time()
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        elapsed_time = time.time() - start_time
        print(f"VPN connection command executed in {elapsed_time:.2f} seconds.")
        print("Output:")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        elapsed_time = time.time() - start_time
        print(f"Failed to connect to VPN '{vpn_name}'. Error code: {e.returncode}")
        print("Error output:")
        print(e.stderr)
        return False
def list_all_vpn_connections():
    """List all VPN connections configured on the system."""
    cmd = 'Get-VpnConnection | Select-Object -ExpandProperty Name'
    result = subprocess.run(['powershell', '-Command', cmd], capture_output=True, text=True)
    vpn_names = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    print("Configured VPN connections:")
    for name in vpn_names:
        print(f"- {name}")
    return vpn_names
vpn_names = list_all_vpn_connections()
if vpn_names:
    # if the list size is 1 return the first item
    if len(vpn_names) == 1:
        vpn_name = vpn_names[0]
    else:
        # otherwise, return the closest match to 'HC', 'Hennepin County' or 'Hennepin' or 'County
        vpn_name = next((name for name in vpn_names if 'HC' in name or 'Hennepin County' in name or 'Hennepin' in name or 'County' in name), None)
    if vpn_name:
        print(f"Connecting to VPN: {vpn_name}")
        success = connect_vpn_wmi(vpn_name)
        if success:
            exit(0)
        else:
            exit(1)