output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.nitro_enclave.id
}

output "instance_public_ip" {
  description = "Public IP address of the enclave instance"
  value = var.allocate_elastic_ip ? (
    length(aws_eip.nitro_enclave) > 0 ? aws_eip.nitro_enclave[0].public_ip : null
  ) : aws_instance.nitro_enclave.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the enclave instance"
  value       = aws_instance.nitro_enclave.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to instance"
  value       = "ssh -i ~/.ssh/nautilus-key ec2-user@${aws_instance.nitro_enclave.public_ip}"
}

output "enclave_api_endpoint" {
  description = "Nautilus enclave API endpoint"
  value = var.allocate_elastic_ip ? (
    length(aws_eip.nitro_enclave) > 0 ? "http://${aws_eip.nitro_enclave[0].public_ip}:5000" : null
  ) : "http://${aws_instance.nitro_enclave.public_ip}:5000"
}

output "security_group_id" {
  description = "Security group ID for the enclave"
  value       = aws_security_group.nitro_enclave.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD"
  value = var.use_spot_instance ? (
    var.instance_type == "c6a.xlarge" ? "$25-40 (spot)" : "$15-30 (spot)"
  ) : (
    var.instance_type == "c6a.xlarge" ? "$120-150 (on-demand)" : "$80-100 (on-demand)"
  )
}

output "env_variables" {
  description = "Environment variables for backend"
  value = {
    NAUTILUS_API_URL = var.allocate_elastic_ip ? (
      length(aws_eip.nitro_enclave) > 0 ? "http://${aws_eip.nitro_enclave[0].public_ip}:5000" : null
    ) : "http://${aws_instance.nitro_enclave.public_ip}:5000"
    USE_REAL_NAUTILUS = "true"
    ENCLAVE_ID        = "nitro_enclave_1"
  }
  sensitive = false
}

output "next_steps" {
  description = "What to do next after deployment"
  value = <<-EOT

  ✅ Nautilus Nitro Enclave deployed successfully!

  📋 Next steps:

  1. SSH into instance:
     ssh -i ~/.ssh/nautilus-key ec2-user@${aws_instance.nitro_enclave.public_ip}

  2. Check enclave status:
     nitro-cli describe-enclaves

  3. View enclave console:
     ENCLAVE_ID=$(nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')
     nitro-cli console --enclave-id $ENCLAVE_ID

  4. Update backend .env:
     NAUTILUS_API_URL=${var.allocate_elastic_ip ? (
       length(aws_eip.nitro_enclave) > 0 ? "http://${aws_eip.nitro_enclave[0].public_ip}:5000" : "http://${aws_instance.nitro_enclave.public_ip}:5000"
     ) : "http://${aws_instance.nitro_enclave.public_ip}:5000"}
     USE_REAL_NAUTILUS=true

  5. Test connection:
     curl ${var.allocate_elastic_ip ? (
       length(aws_eip.nitro_enclave) > 0 ? "http://${aws_eip.nitro_enclave[0].public_ip}:8080/health" : "http://${aws_instance.nitro_enclave.public_ip}:8080/health"
     ) : "http://${aws_instance.nitro_enclave.public_ip}:8080/health"}

  💰 Estimated cost: ${var.use_spot_instance ? "$25-40/month" : "$120-150/month"}

  🛑 To stop instance (save cost):
     aws ec2 stop-instances --instance-ids ${aws_instance.nitro_enclave.id}
  EOT
}
