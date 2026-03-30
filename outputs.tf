output "api_endpoint" {
  description = "API Gateway raw endpoint"
  value       = aws_apigatewayv2_api.url_shortener.api_endpoint
}

output "api_domain" {
  description = "API custom domain"
  value       = "https://${var.api_subdomain}"
}

output "frontend_domain" {
  description = "Frontend domain"
  value       = "https://${var.subdomain}"
}

output "cloudfront_frontend_id" {
  description = "Frontend CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend.id
}
