"""
Storage configuration settings for the application.
Includes settings for file uploads, media storage, and static files.
"""

import os
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Media files (user uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Place photos specific settings
PLACE_PHOTOS_ROOT = os.path.join(MEDIA_ROOT, 'places')

# Maximum upload size (5MB)
MAX_UPLOAD_SIZE = 5 * 1024 * 1024

# Image dimensions limits
MIN_IMAGE_DIMENSION = 300
MAX_IMAGE_DIMENSION = 4000

# Thumbnail settings
THUMBNAIL_SIZE = (200, 200)
THUMBNAIL_QUALITY = 85

# Allowed image formats
ALLOWED_IMAGE_FORMATS = ['JPEG', 'PNG', 'WEBP']

# Future S3 configuration (commented out until needed)
"""
# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'private'
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

# Use S3 for media storage
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
""" 