variable "region" {
  description = "AWS region"
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Root domain"
  default     = "hasankurt.com"
}

variable "subdomain" {
  description = "Subdomain for URL shortener"
  default     = "short.hasankurt.com"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  default     = "url-shortener"
}
