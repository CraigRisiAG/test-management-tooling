# S3 Module for test-management-tooling

resource "aws_s3_bucket" "testmgr_storage" {
  bucket = "testmgr-storage-${var.environment}-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "testmgr-storage-${var.environment}"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "testmgr_storage" {
  bucket = aws_s3_bucket.testmgr_storage.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning
resource "aws_s3_bucket_versioning" "testmgr_storage" {
  bucket = aws_s3_bucket.testmgr_storage.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "testmgr_storage" {
  bucket = aws_s3_bucket.testmgr_storage.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.enable_encryption ? "aws:kms" : "AES256"
      kms_master_key_id = var.enable_encryption ? aws_kms_key.s3[0].arn : null
    }
  }
}

# Lifecycle rules
resource "aws_s3_bucket_lifecycle_configuration" "testmgr_storage" {
  bucket = aws_s3_bucket.testmgr_storage.id
  
  rule {
    id     = "archive-old-exports"
    status = "Enabled"
    
    filter {
      prefix = "exports/"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
  
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    
    filter {
      prefix = "logs/"
    }
    
    expiration {
      days = 30
    }
  }
}

# KMS key for encryption
resource "aws_kms_key" "s3" {
  count               = var.enable_encryption ? 1 : 0
  description         = "KMS key for testmgr S3 encryption"
  enable_key_rotation = true
  
  tags = {
    Name = "testmgr-s3-key-${var.environment}"
  }
}

resource "aws_kms_alias" "s3" {
  count         = var.enable_encryption ? 1 : 0
  name          = "alias/testmgr-s3-${var.environment}"
  target_key_id = aws_kms_key.s3[0].key_id
}

# CORS configuration for web uploads
resource "aws_s3_bucket_cors_configuration" "testmgr_storage" {
  bucket = aws_s3_bucket.testmgr_storage.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]  # Restrict in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

data "aws_caller_identity" "current" {}
