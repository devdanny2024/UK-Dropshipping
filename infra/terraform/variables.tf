variable "project_name" {
  type    = string
  default = "uk2me"
}

variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "container_port" {
  type    = number
  default = 4000
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "backend_image" {
  type    = string
  default = "public.ecr.aws/docker/library/node:20-alpine"
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}
