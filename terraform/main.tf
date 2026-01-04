# Terraform configuration for test-management-tooling on AWS
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "testmgr-terraform-state"
    key            = "testmgr/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "testmgr-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "test-management-tooling"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ECS Cluster for running containers
module "ecs" {
  source = "./modules/ecs"
  
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  
  container_image    = var.container_image
  container_port     = var.container_port
  desired_count      = var.desired_count
  
  dynamodb_table_arn = module.dynamodb.table_arn
  s3_bucket_arn      = module.s3.bucket_arn
}

# DynamoDB for structured data (users, sessions, metadata)
module "dynamodb" {
  source = "./modules/dynamodb"
  
  environment = var.environment
}

# S3 for file storage (test results, artifacts, exports)
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
}

# API Gateway for REST API access
module "api_gateway" {
  source = "./modules/api_gateway"
  
  environment         = var.environment
  vpc_link_target_arn = module.ecs.load_balancer_arn
}

# CloudWatch for logging and monitoring
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
}

# IAM roles and policies
module "iam" {
  source = "./modules/iam"
  
  environment        = var.environment
  s3_bucket_arn      = module.s3.bucket_arn
  dynamodb_table_arn = module.dynamodb.table_arn
}
