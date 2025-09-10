import platform
import requests
if platform.system() == 'Windows':
    import wmi
    import subprocess
    import time
    import pythoncom
    # Create your tests here
    def set_tunnel_type_ikve2(vpn_name):
        """Force the VPN connection to use IKEv2 protocol."""
        cmd = f'Set-VpnConnection -Name "{vpn_name}" -TunnelType IKEv2 -Force'
        subprocess.run(['powershell', '-Command', cmd], capture_output=True)

    def connect_vpn_wmi(vpn_name):
        pythoncom.CoInitialize()

        try:
            c = wmi.WMI()
            #print(f"Checking existing VPN connections for '{vpn_name}'...")
            for conn in c.Win32_NetworkConnection():
                #print(f"Checking connection: {conn.Name}")
                if vpn_name.lower() in conn.Name.lower():
                    #print(f"VPN '{vpn_name}' already connected.")
                    return True
            #print(f"Setting VPN '{vpn_name}' to use IKEv2 protocol.")
            set_tunnel_type_ikve2(vpn_name)
            
            command = ['rasdial', vpn_name]
            #print(f"Connecting to VPN '{vpn_name}' with command: {' '.join(command)}")
            start_time = time.time()
            result = subprocess.run(command, capture_output=True, text=True, check=True)
            elapsed_time = time.time() - start_time
            #print(f"VPN connection command executed in {elapsed_time:.2f} seconds.")
            #print("Output:")
            #print(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            elapsed_time = time.time() - start_time
            #print(f"Failed to connect to VPN '{vpn_name}'. Error code: {e.returncode}")
            #print("Error output:")
            #print(e.stderr)
            return False
        finally:
            pythoncom.CoUninitialize()
    def list_all_vpn_connections():
        """List all VPN connections configured on the system."""
        cmd = 'Get-VpnConnection | Select-Object -ExpandProperty Name'
        result = subprocess.run(['powershell', '-Command', cmd], capture_output=True, text=True)
        vpn_names = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        #print("Configured VPN connections:")
        for name in vpn_names:
            #print(f"- {name}")
            pass
        return vpn_names

    def connect_to_vpn(): #type: ignore
        # GUIDELINES:
        ## VPN should be connected if we don't have access to the APEX page
        ## NOTE: If at any point, County changes the login page, this will break
        ##       and we will need to update the logic here.
        apex_url = "https://hprd.co.hennepin.mn.us"
        try:
            response = requests.get(apex_url, timeout=5)
            if response.status_code == 200:
                #print("Already connected to APEX page; no VPN connection needed.")
                return True
        except requests.RequestException as e:
            #print(f"Could not reach APEX page: {e}")
            pass
        
        vpn_names = list_all_vpn_connections()
        if vpn_names:
            # if the list size is 1 return the first item
            if len(vpn_names) == 1:
                vpn_name = vpn_names[0]
            else:
                # otherwise, return the closest match to 'HC', 'Hennepin County' or 'Hennepin' or 'County
                vpn_name = next((name for name in vpn_names if 'HC' in name or 'Hennepin County' in name or 'Hennepin' in name or 'County' in name), None)
            if vpn_name:
                #print(f"Connecting to VPN: {vpn_name}")
                success = connect_vpn_wmi(vpn_name)
                return success
        else:
            #print("No VPN connections configured.")
            return False
        

    if __name__ == "__main__":
        # Example usage
        if connect_to_vpn():
            #print("VPN connection established successfully.")
            pass
        else:
            #print("Failed to establish VPN connection.")
            pass
else:
    def connect_to_vpn():
        return
    #print("This script is designed to run on Windows systems only.")