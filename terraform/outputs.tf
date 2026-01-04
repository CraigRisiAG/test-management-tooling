# Terraform outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = module.ecs.load_balancer_dns
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
    value       = module.api_gateway.api_endpoint
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.dynamodb.table_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.s3.bucket_name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = module.cloudwatch.log_group_name
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = module.iam.task_execution_role_arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = module.iam.task_role_arn
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    environment     = var.environment
    region          = var.aws_region
      api_endpoint    = module.api_gateway.api_endpoint
    lb_endpoint     = "http://${module.ecs.load_balancer_dns}"
      ecs_cluster     = module.ecs.cluster_name
    data_stores = {
      dynamodb = module.dynamodb.table_name
      s3       = module.s3.bucket_name
    }
  }
}
