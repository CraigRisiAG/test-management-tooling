variable "environment" {
  type = string
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "alert_emails" {
  type    = list(string)
  default = []
}
