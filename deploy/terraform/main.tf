# Recording Studio Manager - Multi-Region AWS Infrastructure
#
# This Terraform configuration deploys the RSM application across 3 AWS regions:
# - us-east-1 (Primary)
# - eu-west-1 (Europe)
# - ap-southeast-1 (Asia Pacific)
#
# Prerequisites:
# - AWS CLI configured with appropriate credentials
# - Terraform >= 1.0
#
# Usage:
#   cd deploy/terraform
#   terraform init
#   terraform plan -out=tfplan
#   terraform apply tfplan

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state storage
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "rsm-terraform-state"
  #   key            = "multi-region/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "rsm-terraform-locks"
  #   encrypt        = true
  # }
}

# =============================================================================
# Variables
# =============================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "rsm"
}

variable "domain" {
  description = "Primary domain name"
  type        = string
  default     = "example.com"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "eu-west-1", "ap-southeast-1"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "ecs_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "ECS task memory (MB)"
  type        = number
  default     = 1024
}

# =============================================================================
# Providers
# =============================================================================

provider "aws" {
  region = var.primary_region
  alias  = "primary"

  default_tags {
    tags = {
      Application = var.app_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "eu_west_1"
}

provider "aws" {
  region = "ap-southeast-1"
  alias  = "ap_southeast_1"
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {
  provider = aws.primary
}

data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "eu_west_1" {
  provider = aws.eu_west_1
  state    = "available"
}

data "aws_availability_zones" "ap_southeast_1" {
  provider = aws.ap_southeast_1
  state    = "available"
}

# =============================================================================
# Local Values
# =============================================================================

locals {
  account_id = data.aws_caller_identity.current.account_id

  region_configs = {
    "us-east-1" = {
      name         = "US East (N. Virginia)"
      short_name   = "us"
      is_primary   = true
      azs          = slice(data.aws_availability_zones.us_east_1.names, 0, 3)
      provider     = "us_east_1"
      subdomain    = "api-us"
      cdn_subdomain = "cdn-us"
    }
    "eu-west-1" = {
      name         = "EU West (Ireland)"
      short_name   = "eu"
      is_primary   = false
      azs          = slice(data.aws_availability_zones.eu_west_1.names, 0, 3)
      provider     = "eu_west_1"
      subdomain    = "api-eu"
      cdn_subdomain = "cdn-eu"
    }
    "ap-southeast-1" = {
      name         = "Asia Pacific (Singapore)"
      short_name   = "ap"
      is_primary   = false
      azs          = slice(data.aws_availability_zones.ap_southeast_1.names, 0, 3)
      provider     = "ap_southeast_1"
      subdomain    = "api-ap"
      cdn_subdomain = "cdn-ap"
    }
  }
}

# =============================================================================
# VPC Module (per region)
# =============================================================================

module "vpc_us_east_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us_east_1
  }

  name        = "${var.app_name}-${var.environment}-us-east-1"
  cidr_block  = "10.0.0.0/16"
  azs         = local.region_configs["us-east-1"].azs
  environment = var.environment
}

module "vpc_eu_west_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.eu_west_1
  }

  name        = "${var.app_name}-${var.environment}-eu-west-1"
  cidr_block  = "10.1.0.0/16"
  azs         = local.region_configs["eu-west-1"].azs
  environment = var.environment
}

module "vpc_ap_southeast_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.ap_southeast_1
  }

  name        = "${var.app_name}-${var.environment}-ap-southeast-1"
  cidr_block  = "10.2.0.0/16"
  azs         = local.region_configs["ap-southeast-1"].azs
  environment = var.environment
}

# =============================================================================
# RDS Aurora Global Database
# =============================================================================

resource "aws_rds_global_cluster" "main" {
  provider = aws.primary

  global_cluster_identifier = "${var.app_name}-${var.environment}-global"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = "rsm_master"
  storage_encrypted         = true
}

module "aurora_us_east_1" {
  source = "./modules/aurora"

  providers = {
    aws = aws.us_east_1
  }

  name                     = "${var.app_name}-${var.environment}-us-east-1"
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine_version           = "15.4"
  instance_class           = var.db_instance_class
  is_primary               = true
  vpc_id                   = module.vpc_us_east_1.vpc_id
  subnet_ids               = module.vpc_us_east_1.private_subnet_ids
  environment              = var.environment
}

module "aurora_eu_west_1" {
  source = "./modules/aurora"

  providers = {
    aws = aws.eu_west_1
  }

  name                     = "${var.app_name}-${var.environment}-eu-west-1"
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine_version           = "15.4"
  instance_class           = var.db_instance_class
  is_primary               = false
  vpc_id                   = module.vpc_eu_west_1.vpc_id
  subnet_ids               = module.vpc_eu_west_1.private_subnet_ids
  environment              = var.environment

  depends_on = [module.aurora_us_east_1]
}

module "aurora_ap_southeast_1" {
  source = "./modules/aurora"

  providers = {
    aws = aws.ap_southeast_1
  }

  name                     = "${var.app_name}-${var.environment}-ap-southeast-1"
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine_version           = "15.4"
  instance_class           = var.db_instance_class
  is_primary               = false
  vpc_id                   = module.vpc_ap_southeast_1.vpc_id
  subnet_ids               = module.vpc_ap_southeast_1.private_subnet_ids
  environment              = var.environment

  depends_on = [module.aurora_us_east_1]
}

# =============================================================================
# ElastiCache Global Datastore (Redis)
# =============================================================================

module "redis_us_east_1" {
  source = "./modules/elasticache"

  providers = {
    aws = aws.us_east_1
  }

  name        = "${var.app_name}-${var.environment}-us-east-1"
  is_primary  = true
  vpc_id      = module.vpc_us_east_1.vpc_id
  subnet_ids  = module.vpc_us_east_1.private_subnet_ids
  environment = var.environment
}

module "redis_eu_west_1" {
  source = "./modules/elasticache"

  providers = {
    aws = aws.eu_west_1
  }

  name                    = "${var.app_name}-${var.environment}-eu-west-1"
  is_primary              = false
  primary_replication_group_id = module.redis_us_east_1.replication_group_id
  vpc_id                  = module.vpc_eu_west_1.vpc_id
  subnet_ids              = module.vpc_eu_west_1.private_subnet_ids
  environment             = var.environment

  depends_on = [module.redis_us_east_1]
}

# =============================================================================
# S3 Buckets (per region)
# =============================================================================

module "s3_us_east_1" {
  source = "./modules/s3"

  providers = {
    aws = aws.us_east_1
  }

  bucket_name = "${var.app_name}-files-${var.environment}-us-east-1"
  environment = var.environment
}

module "s3_eu_west_1" {
  source = "./modules/s3"

  providers = {
    aws = aws.eu_west_1
  }

  bucket_name = "${var.app_name}-files-${var.environment}-eu-west-1"
  environment = var.environment
}

module "s3_ap_southeast_1" {
  source = "./modules/s3"

  providers = {
    aws = aws.ap_southeast_1
  }

  bucket_name = "${var.app_name}-files-${var.environment}-ap-southeast-1"
  environment = var.environment
}

# =============================================================================
# ECS Cluster (per region)
# =============================================================================

module "ecs_us_east_1" {
  source = "./modules/ecs"

  providers = {
    aws = aws.us_east_1
  }

  name            = "${var.app_name}-${var.environment}-us-east-1"
  region          = "us-east-1"
  vpc_id          = module.vpc_us_east_1.vpc_id
  subnet_ids      = module.vpc_us_east_1.private_subnet_ids
  public_subnet_ids = module.vpc_us_east_1.public_subnet_ids
  cpu             = var.ecs_cpu
  memory          = var.ecs_memory
  db_host         = module.aurora_us_east_1.cluster_endpoint
  redis_host      = module.redis_us_east_1.primary_endpoint
  s3_bucket       = module.s3_us_east_1.bucket_name
  environment     = var.environment
}

module "ecs_eu_west_1" {
  source = "./modules/ecs"

  providers = {
    aws = aws.eu_west_1
  }

  name            = "${var.app_name}-${var.environment}-eu-west-1"
  region          = "eu-west-1"
  vpc_id          = module.vpc_eu_west_1.vpc_id
  subnet_ids      = module.vpc_eu_west_1.private_subnet_ids
  public_subnet_ids = module.vpc_eu_west_1.public_subnet_ids
  cpu             = var.ecs_cpu
  memory          = var.ecs_memory
  db_host         = module.aurora_eu_west_1.cluster_endpoint
  redis_host      = module.redis_eu_west_1.primary_endpoint
  s3_bucket       = module.s3_eu_west_1.bucket_name
  environment     = var.environment
}

module "ecs_ap_southeast_1" {
  source = "./modules/ecs"

  providers = {
    aws = aws.ap_southeast_1
  }

  name            = "${var.app_name}-${var.environment}-ap-southeast-1"
  region          = "ap-southeast-1"
  vpc_id          = module.vpc_ap_southeast_1.vpc_id
  subnet_ids      = module.vpc_ap_southeast_1.private_subnet_ids
  public_subnet_ids = module.vpc_ap_southeast_1.public_subnet_ids
  cpu             = var.ecs_cpu
  memory          = var.ecs_memory
  db_host         = module.aurora_ap_southeast_1.cluster_endpoint
  redis_host      = module.redis_us_east_1.primary_endpoint  # Use US East until global datastore
  s3_bucket       = module.s3_ap_southeast_1.bucket_name
  environment     = var.environment
}

# =============================================================================
# CloudFront Distribution (Global)
# =============================================================================

module "cloudfront" {
  source = "./modules/cloudfront"

  providers = {
    aws = aws.primary
  }

  name = "${var.app_name}-${var.environment}"
  domain = var.domain

  origins = {
    "us-east-1" = {
      domain_name = module.ecs_us_east_1.alb_dns_name
      origin_id   = "api-us"
    }
    "eu-west-1" = {
      domain_name = module.ecs_eu_west_1.alb_dns_name
      origin_id   = "api-eu"
    }
    "ap-southeast-1" = {
      domain_name = module.ecs_ap_southeast_1.alb_dns_name
      origin_id   = "api-ap"
    }
  }

  environment = var.environment
}

# =============================================================================
# Route53 Health Checks & Failover
# =============================================================================

module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  domain = var.domain

  endpoints = {
    "us-east-1" = {
      dns_name    = module.ecs_us_east_1.alb_dns_name
      zone_id     = module.ecs_us_east_1.alb_zone_id
      is_primary  = true
    }
    "eu-west-1" = {
      dns_name    = module.ecs_eu_west_1.alb_dns_name
      zone_id     = module.ecs_eu_west_1.alb_zone_id
      is_primary  = false
    }
    "ap-southeast-1" = {
      dns_name    = module.ecs_ap_southeast_1.alb_dns_name
      zone_id     = module.ecs_ap_southeast_1.alb_zone_id
      is_primary  = false
    }
  }

  environment = var.environment
}

# =============================================================================
# Outputs
# =============================================================================

output "global_api_endpoint" {
  description = "Global API endpoint (geo-routed)"
  value       = "https://api.${var.domain}"
}

output "regional_endpoints" {
  description = "Regional API endpoints"
  value = {
    "us-east-1"      = "https://api-us.${var.domain}"
    "eu-west-1"      = "https://api-eu.${var.domain}"
    "ap-southeast-1" = "https://api-ap.${var.domain}"
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "database_endpoints" {
  description = "Aurora database endpoints per region"
  value = {
    "us-east-1"      = module.aurora_us_east_1.cluster_endpoint
    "eu-west-1"      = module.aurora_eu_west_1.cluster_endpoint
    "ap-southeast-1" = module.aurora_ap_southeast_1.cluster_endpoint
  }
  sensitive = true
}
