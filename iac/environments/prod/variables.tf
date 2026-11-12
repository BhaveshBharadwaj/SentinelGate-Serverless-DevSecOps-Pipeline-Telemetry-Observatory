variable "aws_region" { default = "ap-south-1" }
variable "admin_bastion_cidr" { type = string }
variable "ami_id" { type = string }
variable "private_subnet_id" { type = string }
variable "kms_key_arn" { type = string }
variable "flow_log_role_arn" { type = string }
variable "cloudwatch_log_group_arn" { type = string }
