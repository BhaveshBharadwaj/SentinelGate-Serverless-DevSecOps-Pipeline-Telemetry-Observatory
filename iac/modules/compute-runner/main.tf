resource "aws_instance" "sentinel_runner" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.runner_profile.name
  monitoring             = true
  ebs_optimized          = true

  # CIS AWS Benchmark: Enforce IMDSv2 session tokens to block SSRF credential theft
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # CIS AWS Benchmark: Encrypt root volume at rest with KMS
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = var.kms_key_arn
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.project_name}-hardened-runner"
    Environment = var.environment
  }
}

resource "aws_iam_role" "runner_role" {
  name = "${var.project_name}-runner-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_instance_profile" "runner_profile" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.runner_role.name
}
