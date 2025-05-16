"""
Utilities for handling photo uploads, validation, and storage.
Includes file validation, thumbnail generation, and storage configuration.
"""

import os
from io import BytesIO
from PIL import Image
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.conf import settings

# Constants for validation
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MIN_DIMENSION = 300
MAX_DIMENSION = 4000
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
THUMBNAIL_SIZE = (200, 200)

class PlacePhotoStorage(FileSystemStorage):
    """
    Custom storage class for place photos.
    Organizes photos in a structured directory pattern: 'places/{place_id}/photos/'.
    
    Future Migration to S3:
    To migrate to S3, create a new storage class inheriting from S3Boto3Storage:
    
    from storages.backends.s3boto3 import S3Boto3Storage
    
    class PlacePhotoS3Storage(S3Boto3Storage):
        location = 'places'
        file_overwrite = False
        default_acl = 'private'
    """
    
    def __init__(self):
        super().__init__(location=settings.PLACE_PHOTOS_ROOT)
    
    def get_available_name(self, name, max_length=None):
        """
        Returns a filename that's free on the target storage system.
        Adds a suffix to the filename if it already exists.
        """
        name = self._normalize_name(name)
        dir_name, file_name = os.path.split(name)
        file_root, file_ext = os.path.splitext(file_name)
        
        counter = 1
        while self.exists(name):
            name = os.path.join(dir_name, f"{file_root}_{counter}{file_ext}")
            counter += 1
        
        return name

def validate_photo_file(file):
    """
    Validates photo files for size, type, and dimensions.
    Raises ValidationError if the file doesn't meet requirements.
    """
    # Check file size
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(
            f'File size must not exceed {MAX_FILE_SIZE/1024/1024}MB'
        )
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f'Only {", ".join(ALLOWED_EXTENSIONS)} files are allowed'
        )
    
    # Check image dimensions
    try:
        img = Image.open(file)
        width, height = img.size
        
        if width < MIN_DIMENSION or height < MIN_DIMENSION:
            raise ValidationError(
                f'Image dimensions must be at least {MIN_DIMENSION}x{MIN_DIMENSION} pixels'
            )
        
        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise ValidationError(
                f'Image dimensions must not exceed {MAX_DIMENSION}x{MAX_DIMENSION} pixels'
            )
        
        # Reset file pointer for future reads
        file.seek(0)
        
    except Exception as e:
        raise ValidationError('Invalid image file') from e

def generate_thumbnail(image_file):
    """
    Generates a thumbnail (200x200) from the given image file.
    Returns the thumbnail as a ContentFile.
    """
    img = Image.open(image_file)
    
    # Convert to RGB if necessary (for PNG/WEBP support)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    
    # Calculate thumbnail dimensions maintaining aspect ratio
    img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    
    # Save thumbnail to bytes buffer
    thumb_buffer = BytesIO()
    img.save(thumb_buffer, format='JPEG', quality=85)
    
    # Create Django ContentFile from buffer
    thumb_file = ContentFile(thumb_buffer.getvalue())
    
    return thumb_file

def get_photo_path(instance, filename):
    """
    Generates the upload path for place photos.
    Format: places/{place_id}/photos/{filename}
    """
    ext = os.path.splitext(filename)[1].lower()
    new_filename = f"{instance.place.id}_{instance.order}{ext}"
    return os.path.join('places', str(instance.place.id), 'photos', new_filename)

def get_thumbnail_path(instance, filename):
    """
    Generates the upload path for photo thumbnails.
    Format: places/{place_id}/photos/thumbnails/{filename}
    """
    ext = os.path.splitext(filename)[1].lower()
    new_filename = f"{instance.place.id}_{instance.order}_thumb{ext}"
    return os.path.join('places', str(instance.place.id), 'photos', 'thumbnails', new_filename) 