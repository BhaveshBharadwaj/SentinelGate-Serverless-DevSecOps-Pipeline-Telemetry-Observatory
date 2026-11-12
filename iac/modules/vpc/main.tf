resource "aws_vpc" "sentinel_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.project_name}-vpc"
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

resource "aws_flow_log" "vpc_flow_audit" {
  iam_role_arn    = var.flow_log_role_arn
  log_destination = var.cloudwatch_log_group_arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.sentinel_vpc.id
}

resource "aws_security_group" "runner_sg" {
  name        = "${var.project_name}-runner-sg"
  description = "Least-privilege security group for SentinelGate CI runner"
  vpc_id      = aws_vpc.sentinel_vpc.id

  ingress {
    description = "SSH access strictly restricted to Admin Bastion CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_bastion_cidr]
  }

  egress {
    description = "Outbound HTTPS for container registry and vulnerability DB updates"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "vpc_id" {
  value = aws_vpc.sentinel_vpc.id
}

output "security_group_id" {
  value = aws_security_group.runner_sg.id
}
