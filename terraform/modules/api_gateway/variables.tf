variable "environment" {
  type = string
}

variable "load_balancer_listener_arn" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["*"]
}

variable "throttling_burst_limit" {
  type    = number
  default = 5000
}

variable "throttling_rate_limit" {
  type    = number
  default = 10000
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "custom_domain_name" {
  type    = string
  default = ""
}

variable "certificate_arn" {
  type    = string
  default = ""
}
