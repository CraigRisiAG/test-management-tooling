variable "environment" {
  type = string
}

variable "enable_backup" {
  type    = bool
  default = true
}

variable "enable_encryption" {
  type    = bool
  default = true
}
