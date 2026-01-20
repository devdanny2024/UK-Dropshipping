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

variable "client_origin" {
  type    = string
  default = "http://localhost:3000"
}

variable "client_session_cookie" {
  type    = string
  default = "client_session"
}

variable "session_ttl_hours" {
  type    = string
  default = "168"
}

variable "api_base_url" {
  type    = string
  default = ""
}
