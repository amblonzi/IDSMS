"""
File storage utility for handling document uploads.

Provides secure file upload, storage, and retrieval functionality.
For production, consider using cloud storage (S3, DigitalOcean Spaces, etc.)
"""
import os
import uuid
import aiofiles
from pathlib import Path
from typing import Tuple, Optional
from fastapi import UploadFile

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger()

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

# Maximum file size (5MB by default)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes


class FileStorage:
    """Handle file storage operations."""
    
    def __init__(self, base_path: str = "uploads"):
        """
        Initialize file storage.
        
        Args:
            base_path: Base directory for file uploads
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def validate_file_type(filename: str, content_type: str) -> Tuple[bool, str]:
        """
        Validate file type based on extension and MIME type.
        
        Args:
            filename: Original filename
            content_type: MIME type from upload
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Get file extension
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"File type .{ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS.keys())}"
        
        # Verify MIME type matches extension
        expected_mime = ALLOWED_EXTENSIONS[ext]
        if content_type != expected_mime:
            return False, f"MIME type mismatch. Expected {expected_mime}, got {content_type}"
        
        return True, ""
    
    @staticmethod
    def validate_file_size(file_size: int) -> Tuple[bool, str]:
        """
        Validate file size.
        
        Args:
            file_size: Size of file in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if file_size > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE / (1024 * 1024)
            actual_mb = file_size / (1024 * 1024)
            return False, f"File size ({actual_mb:.2f}MB) exceeds maximum allowed size ({max_mb:.2f}MB)"
        
        if file_size == 0:
            return False, "File is empty"
        
        return True, ""
    
    async def save_file(
        self,
        file: UploadFile,
        user_id: str,
        document_type: str
    ) -> Tuple[str, str, int]:
        """
        Save uploaded file to storage.
        
        Args:
            file: The uploaded file
            user_id: ID of the user uploading
            document_type: Type of document
            
        Returns:
            Tuple of (file_path, original_filename, file_size)
        """
        try:
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Validate file size
            is_valid, error = self.validate_file_size(file_size)
            if not is_valid:
                raise ValueError(error)
            
            # Validate file type
            is_valid, error = self.validate_file_type(file.filename, file.content_type)
            if not is_valid:
                raise ValueError(error)
            
            # Generate unique filename
            ext = file.filename.rsplit('.', 1)[-1].lower()
            unique_filename = f"{uuid.uuid4()}.{ext}"
            
            # Create user-specific directory
            user_dir = self.base_path / str(user_id) / document_type
            user_dir.mkdir(parents=True, exist_ok=True)
            
            # Full file path
            file_path = user_dir / unique_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            logger.info(f"File saved: {file_path} ({file_size} bytes)")
            
            # Return relative path from base
            relative_path = str(file_path.relative_to(self.base_path))
            return relative_path, file.filename, file_size
            
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            file_path: Relative path to the file
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            full_path = self.base_path / file_path
            if full_path.exists():
                full_path.unlink()
                logger.info(f"File deleted: {full_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False
    
    def get_file_path(self, relative_path: str) -> Path:
        """
        Get full file path from relative path.
        
        Args:
            relative_path: Relative path to the file
            
        Returns:
            Full Path object
        """
        return self.base_path / relative_path
    
    def file_exists(self, relative_path: str) -> bool:
        """
        Check if file exists.
        
        Args:
            relative_path: Relative path to the file
            
        Returns:
            True if file exists, False otherwise
        """
        return self.get_file_path(relative_path).exists()


# Global file storage instance
file_storage = FileStorage()
