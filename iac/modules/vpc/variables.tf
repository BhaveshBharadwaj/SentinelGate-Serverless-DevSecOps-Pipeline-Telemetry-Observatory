variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_cidr" { type = string }
variable "admin_bastion_cidr" { type = string }
variable "flow_log_role_arn" { type = string }
variable "cloudwatch_log_group_arn" { type = string }
