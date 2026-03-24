output "api_endpoint" {
  description = "API Gateway endpoint (ham, CloudFront arkasında)"
  value       = aws_apigatewayv2_api.url_shortener.api_endpoint
}

output "cloudfront_domain" {
  description = "CloudFront domain"
  value       = aws_cloudfront_distribution.url_shortener.domain_name
}

output "short_domain" {
  description = "Kısa URL domain"
  value       = "https://${var.subdomain}"
}
