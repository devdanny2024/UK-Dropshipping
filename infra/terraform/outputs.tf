output "backend_url" {
  value = aws_lb.app.dns_name
}

output "ecr_repository" {
  value = aws_ecr_repository.backend.name
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.backend.name
}
