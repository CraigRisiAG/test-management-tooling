# DynamoDB Module for test-management-tooling

# Main data table with composite key for multi-tenant support
resource "aws_dynamodb_table" "testmgr_data" {
  name           = "testmgr-data-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"
  
  attribute {
    name = "PK"
    type = "S"
  }
  
  attribute {
    name = "SK"
    type = "S"
  }
  
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  
  attribute {
    name = "GSI1SK"
    type = "S"
  }
  
  attribute {
    name = "Type"
    type = "S"
  }
  
  # Global Secondary Index for querying by type
  global_secondary_index {
    name            = "TypeIndex"
    hash_key        = "Type"
    range_key       = "SK"
    projection_type = "ALL"
  }
  
  # Global Secondary Index for inverted queries
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "TTL"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = var.enable_backup
  }
  
  server_side_encryption {
    enabled     = var.enable_encryption
    kms_key_arn = var.enable_encryption ? aws_kms_key.dynamodb[0].arn : null
  }
  
  tags = {
    Name = "testmgr-data-${var.environment}"
  }
}

# KMS key for encryption
resource "aws_kms_key" "dynamodb" {
  count               = var.enable_encryption ? 1 : 0
  description         = "KMS key for testmgr DynamoDB encryption"
  enable_key_rotation = true
  
  tags = {
    Name = "testmgr-dynamodb-key-${var.environment}"
  }
}

resource "aws_kms_alias" "dynamodb" {
  count         = var.enable_encryption ? 1 : 0
  name          = "alias/testmgr-dynamodb-${var.environment}"
  target_key_id = aws_kms_key.dynamodb[0].key_id
}

# Auto-scaling for provisioned mode (optional)
# Uncomment if switching from PAY_PER_REQUEST to PROVISIONED billing

# resource "aws_appautoscaling_target" "read" {
#   max_capacity       = 100
#   min_capacity       = 5
#   resource_id        = "table/${aws_dynamodb_table.testmgr_data.name}"
#   scalable_dimension = "dynamodb:table:ReadCapacityUnits"
#   service_namespace  = "dynamodb"
# }
# 
# resource "aws_appautoscaling_policy" "read" {
#   name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.read.resource_id}"
#   policy_type        = "TargetTrackingScaling"
#   resource_id        = aws_appautoscaling_target.read.resource_id
#   scalable_dimension = aws_appautoscaling_target.read.scalable_dimension
#   service_namespace  = aws_appautoscaling_target.read.service_namespace
#   
#   target_tracking_scaling_policy_configuration {
#     predefined_metric_specification {
#       predefined_metric_type = "DynamoDBReadCapacityUtilization"
#     }
#     target_value = 70.0
#   }
# }
