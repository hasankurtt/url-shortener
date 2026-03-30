variable "region" {
  description = "AWS region"
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Root domain"
  default     = "hasankurt.com"
}

variable "subdomain" {
  description = "Frontend subdomain"
  default     = "short.hasankurt.com"
}

variable "api_subdomain" {
  description = "API subdomain"
  default     = "api.short.hasankurt.com"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  default     = "url-shortener"
}
