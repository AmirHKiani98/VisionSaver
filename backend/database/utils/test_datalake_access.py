"""
Test script to check access to Azure Data Lake Storage Gen2
"""
import os
import sys
import dotenv
from azure.identity import InteractiveBrowserCredential
from azure.storage.filedatalake import DataLakeServiceClient
from django.conf import settings

# Add Django settings to environment
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

# Load environment variables
dotenv.load_dotenv(settings.ENV_PATH)

# Storage account details
account_url = "https://stgmdwdls.dfs.core.windows.net"
file_system_name = "publicworks-fs"
directory_path = "Landing/TMC/AMIR"
tenant_id = os.getenv("AZURE_TENANT_ID")

if not tenant_id:
    print("AZURE_TENANT_ID environment variable not set. Please set it before running this script.")
    sys.exit(1)

def test_datalake_access():
    print(f"\nTesting access to Azure Data Lake Storage Gen2:")
    print(f"Account:    {account_url}")
    print(f"Filesystem: {file_system_name}")
    print(f"Directory:  {directory_path}")
    print(f"Tenant ID:  {tenant_id}")
    print("-" * 50)
    
    try:
        # Create a credential object
        print("\nAuthenticating using InteractiveBrowserCredential...")
        credential = InteractiveBrowserCredential(tenant_id=tenant_id)
        
        # Create the service client
        service_client = DataLakeServiceClient(account_url=account_url, credential=credential)
        print("✓ Successfully created Data Lake service client")
        
        # Get a file system client
        file_system_client = service_client.get_file_system_client(file_system=file_system_name)
        print(f"✓ Successfully accessed file system '{file_system_name}'")
        
        # Get a directory client
        directory_client = file_system_client.get_directory_client(directory_path)
        print(f"✓ Successfully accessed directory path '{directory_path}'")
        
        # Try to list files in the directory
        print(f"\nAttempting to LIST FILES in {directory_path}...")
        paths = list(directory_client.get_paths(max_results=10))
        print(f"✓ Success! Found {len(paths)} items in this directory:")
        for path in paths:
            path_name = path.name.replace(f"{directory_path}/", "")
            is_directory = path.is_directory
            print(f" - {'📁' if is_directory else '📄'} {path_name}")
        
        # Try to create a small test file
        print("\nAttempting to UPLOAD a test file...")
        file_name = "test_access.txt"
        file_client = directory_client.create_file(file_name)
        content = b"This is a test file to check write access. Created by VisionSaver app."
        file_client.append_data(content, 0, len(content))
        file_client.flush_data(len(content))
        print(f"✓ Successfully created and wrote to file: {file_name}")
        
        # Clean up - delete the test file
        print("\nCleaning up...")
        file_client.delete_file()
        print(f"✓ Deleted test file: {file_name}")
        
        print("\n✅ SUCCESS: You have full read/write access to this location!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        
        if "AuthorizationPermissionMismatch" in str(e):
            print("\nYou don't have sufficient permissions to access this location.")
            print("Please ask your Azure administrator to grant you appropriate permissions.")
            print("You'll likely need 'Storage File Data Contributor' role for this storage account/path.")
        elif "FilesystemNotFound" in str(e):
            print(f"\nThe filesystem '{file_system_name}' doesn't exist or you don't have access to it.")
        elif "PathNotFound" in str(e):
            print(f"\nThe directory path '{directory_path}' doesn't exist or you don't have access to it.")
            print("You may have access to the filesystem but not this specific directory.")
        
        return False

if __name__ == "__main__":
    test_datalake_access()
