terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source                   = "../../modules/vpc"
  project_name             = "sentinelgate"
  environment              = "prod"
  vpc_cidr                 = "10.40.0.0/16"
  admin_bastion_cidr       = var.admin_bastion_cidr
  flow_log_role_arn        = var.flow_log_role_arn
  cloudwatch_log_group_arn = var.cloudwatch_log_group_arn
}

module "compute_runner" {
  source            = "../../modules/compute-runner"
  project_name      = "sentinelgate"
  environment       = "prod"
  ami_id            = var.ami_id
  instance_type     = "t3.medium"
  subnet_id         = var.private_subnet_id
  security_group_id = module.vpc.security_group_id
  kms_key_arn       = var.kms_key_arn
}
