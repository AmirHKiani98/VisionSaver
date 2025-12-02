from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.conf import settings
from azure.identity import InteractiveBrowserCredential
from azure.storage.blob import BlobServiceClient
import os
import dotenv
from .utils.azure_blobs import (
    get_blob_service_client,
    get_container_client,
    AZURE_BLOB_ACCOUNT_URL,
    AZURE_BLOB_CONTAINER,
    AZURE_TENANT_ID
)

# Create your tests here.
class AzureDatabaseTestCase(TestCase):
    def setUp(self):
        # Load environment variables to ensure they're available for tests
        dotenv.load_dotenv(settings.ENV_PATH)
        self.account_url = AZURE_BLOB_ACCOUNT_URL
        self.container_name = AZURE_BLOB_CONTAINER
        self.tenant_id = AZURE_TENANT_ID

    def test_placeholder(self):
        self.assertTrue(True)

    @patch('database.utils.azure_blobs.InteractiveBrowserCredential')
    @patch('database.utils.azure_blobs.BlobServiceClient')
    def test_connection(self, mock_blob_service, mock_credential):
        """Test Azure Blob Storage connectivity and basic operations."""
        # Check if required environment variables are set
        self.assertIsNotNone(self.account_url, "AZURE_BLOB_ACCOUNT_URL environment variable not set")
        self.assertIsNotNone(self.container_name, "AZURE_BLOB_CONTAINER environment variable not set")
        self.assertIsNotNone(self.tenant_id, "AZURE_TENANT_ID environment variable not set")

        # Configure mocks
        mock_credential_instance = MagicMock()
        mock_credential.return_value = mock_credential_instance

        mock_blob_service_instance = MagicMock()
        mock_container_client = MagicMock()
        mock_blob_service.return_value = mock_blob_service_instance
        mock_blob_service_instance.get_container_client.return_value = mock_container_client
        
        # Test getting blob service client
        blob_service_client = get_blob_service_client()
        self.assertEqual(blob_service_client, mock_blob_service_instance)
        mock_credential.assert_called_once_with(tenant_id=self.tenant_id)
        mock_blob_service.assert_called_once_with(
            account_url=self.account_url,
            credential=mock_credential_instance
        )
        
        # Test getting container client
        container_client = get_container_client()
        self.assertEqual(container_client, mock_container_client)
        mock_blob_service_instance.get_container_client.assert_called_once_with(self.container_name)

    @patch('database.utils.azure_blobs.InteractiveBrowserCredential')
    @patch('database.utils.azure_blobs.BlobServiceClient')
    def test_live_connection(self, mock_blob_service, mock_credential):
        """
        Test actual Azure Blob Storage connection if environment variables are available.
        This test will be skipped if proper credentials are not available.
        """
        # Skip this test if running in CI environment or credentials aren't available
        if 'CI' in os.environ or not all([self.account_url, self.container_name, self.tenant_id]):
            self.skipTest("Skipping live connection test - credentials not available or running in CI")

        # Remove mocks for actual connection test
        mock_blob_service.side_effect = lambda account_url, credential: BlobServiceClient(
            account_url=account_url, credential=credential
        )
        mock_credential.side_effect = InteractiveBrowserCredential

        try:
            # Try to get actual clients
            blob_service_client = get_blob_service_client()
            container_client = get_container_client()
            
            # Check if container exists and is accessible
            container_properties = container_client.get_container_properties()
            self.assertIsNotNone(container_properties)
            
            # Test list blobs operation
            blobs = list(container_client.list_blobs(max_results=5))
            
            # Don't assert on number of blobs, just that the operation worked
            self.assertIsNotNone(blobs)
            
            # Log success message
            print(f"Successfully connected to Azure Blob Storage container '{self.container_name}'")
            print(f"Container contains {len(blobs)} blobs (showing up to 5)")
            
        except Exception as e:
            self.fail(f"Live connection test failed with error: {str(e)}")