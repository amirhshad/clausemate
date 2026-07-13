"""Shared test fixtures for Clausemate API tests."""

import json
import os
import pytest
from unittest.mock import MagicMock, patch
from io import BytesIO

# Set dummy env vars before importing the handler
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    mock = MagicMock()
    # Chain methods return the mock itself for fluent API
    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.delete.return_value = mock
    mock.eq.return_value = mock
    mock.gte.return_value = mock
    mock.order.return_value = mock
    mock.single.return_value = mock
    mock.execute.return_value = MagicMock(data=[], count=0)
    return mock


@pytest.fixture
def mock_user_id():
    return "test-user-id-12345"


def build_multipart_body(files, metadata=None):
    """Build a multipart/form-data body for testing file uploads."""
    boundary = "----TestBoundary123"
    body = b""

    for f in files:
        body += f"------TestBoundary123\r\n".encode()
        body += f'Content-Disposition: form-data; name="files"; filename="{f["name"]}"\r\n'.encode()
        body += b"Content-Type: application/pdf\r\n\r\n"
        body += f["content"]
        body += b"\r\n"

    if metadata:
        body += b"------TestBoundary123\r\n"
        body += b'Content-Disposition: form-data; name="metadata"\r\n'
        body += b"Content-Type: application/json\r\n\r\n"
        body += json.dumps(metadata).encode()
        body += b"\r\n"

    body += b"------TestBoundary123--\r\n"

    content_type = "multipart/form-data; boundary=----TestBoundary123"
    return body, content_type
