# from django.test import TestCase
# from backend.api.views import connect_vpn_wmi
# import wmi
# Create your tests here.
# def connect_vpn_wmi(vpn_name):
#     c = wmi.WMI()
#     for conn in c.Win32_NetworkConnection():
#         if vpn_name.lower() in conn.Name.lower():
#             print(f"VPN '{vpn_name}' already connected.")
#             return True

#     shell = wmi.WMI(namespace='root\\CIMV2')
#     shell_obj = shell.Win32_Process

#     command = f'rasdial "{vpn_name}"'
#     result, pid = shell_obj.Create(CommandLine=command)
#     return result == 0
# connect_vpn_wmi('HC VPN')