import os
import dotenv
from datetime import datetime, timezone
from azure.identity import InteractiveBrowserCredential
from azure.storage.blob import BlobServiceClient
from django.conf import settings
# --- ENV SETUP ---
dotenv.load_dotenv(settings.ENV_PATH)

AZURE_BLOB_ACCOUNT_URL = os.getenv("AZURE_BLOB_ACCOUNT_URL")
AZURE_BLOB_CONTAINER = os.getenv("AZURE_BLOB_CONTAINER")
AZURE_TENANT_ID = os.getenv("AZURE_TENANT_ID")


def get_blob_service_client():
    """
    Initializes and returns the Azure BlobServiceClient.
    """
    credential = InteractiveBrowserCredential(tenant_id=AZURE_TENANT_ID)
    blob_service_client = BlobServiceClient(
        account_url=AZURE_BLOB_ACCOUNT_URL,
        credential=credential
    )
    return blob_service_client

def get_container_client():
    """
    Returns the Blob Container Client.
    """
    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client(AZURE_BLOB_CONTAINER)
    return container_client

def timestamped(name_prefix: str, ext: str) -> str:
    """
    Generates a timestamped filename.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    return f"{name_prefix}_{timestamp}.{ext}"