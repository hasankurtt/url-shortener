terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# ACM for CloudFront must be in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ─────────────────────────────────────────────
# IAM — Lambda execution role
# ─────────────────────────────────────────────

# Bu rol Lambda'nın AWS servislerine erişmesini sağlıyor.
# Lambda'nın "kimliği" gibi düşünebilirsin.
resource "aws_iam_role" "lambda_role" {
  name = "url-shortener-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Lambda'nın CloudWatch'a log yazabilmesi için AWS'nin hazır policy'si
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda'nın DynamoDB'ye okuma/yazma yapabilmesi için custom policy
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "url-shortener-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ]
      Resource = "arn:aws:dynamodb:${var.region}:*:table/${var.dynamodb_table_name}"
    }]
  })
}

# ─────────────────────────────────────────────
# Lambda — kod paketini zip'le ve yükle
# ─────────────────────────────────────────────

# Terraform, handler.py dosyasını otomatik zip'leyip Lambda'ya yükliyor
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/handler.py"
  output_path = "${path.module}/lambda/handler.zip"
}

# URL kısaltma fonksiyonu
resource "aws_lambda_function" "shorten" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "url-shortener-shorten"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handler.shorten_url"  # handler.py içindeki shorten_url fonksiyonu
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }
}

# Redirect fonksiyonu
resource "aws_lambda_function" "redirect" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "url-shortener-redirect"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handler.redirect_url"  # handler.py içindeki redirect_url fonksiyonu
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }
}

# ─────────────────────────────────────────────
# API Gateway — HTTP API (v2, daha ucuz ve basit)
# ─────────────────────────────────────────────

resource "aws_apigatewayv2_api" "url_shortener" {
  name          = "url-shortener-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST"]
    allow_headers = ["Content-Type"]
  }
}

# API Gateway'in Lambda'yı çağırabilmesi için izin
resource "aws_lambda_permission" "shorten" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shorten.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.url_shortener.execution_arn}/*/*"
}

resource "aws_lambda_permission" "redirect" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.redirect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.url_shortener.execution_arn}/*/*"
}

# Lambda integration — API Gateway ile Lambda'yı bağlıyor
resource "aws_apigatewayv2_integration" "shorten" {
  api_id                 = aws_apigatewayv2_api.url_shortener.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.shorten.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "redirect" {
  api_id                 = aws_apigatewayv2_api.url_shortener.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.redirect.invoke_arn
  payload_format_version = "2.0"
}

# Route'lar — hangi endpoint hangi Lambda'ya gidecek
resource "aws_apigatewayv2_route" "shorten" {
  api_id    = aws_apigatewayv2_api.url_shortener.id
  route_key = "POST /shorten"
  target    = "integrations/${aws_apigatewayv2_integration.shorten.id}"
}

resource "aws_apigatewayv2_route" "redirect" {
  api_id    = aws_apigatewayv2_api.url_shortener.id
  route_key = "GET /{short_code}"
  target    = "integrations/${aws_apigatewayv2_integration.redirect.id}"
}

# Stage — API'nin yayın ortamı ($default = direkt canlı)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.url_shortener.id
  name        = "$default"
  auto_deploy = true
}

# ─────────────────────────────────────────────
# ACM — short.hasankurt.com için SSL sertifikası
# ─────────────────────────────────────────────

resource "aws_acm_certificate" "url_shortener" {
  provider          = aws.us_east_1
  domain_name       = var.subdomain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ─────────────────────────────────────────────
# Route 53 — short.hasankurt.com DNS kaydı
# ─────────────────────────────────────────────

# Mevcut hosted zone'u veri olarak çekiyoruz (yeniden oluşturmuyoruz)
data "aws_route53_zone" "main" {
  name = var.domain_name
}

# ACM DNS validation kaydı
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.url_shortener.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "url_shortener" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.url_shortener.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ─────────────────────────────────────────────
# CloudFront — API Gateway önüne CDN + custom domain
# ─────────────────────────────────────────────

resource "aws_cloudfront_distribution" "url_shortener" {
  enabled = true
  aliases = [var.subdomain]

  origin {
    domain_name = replace(aws_apigatewayv2_api.url_shortener.api_endpoint, "https://", "")
    origin_id   = "APIGateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "APIGateway"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.url_shortener.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.url_shortener]
}

# short.hasankurt.com → CloudFront
resource "aws_route53_record" "url_shortener" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.url_shortener.domain_name
    zone_id                = aws_cloudfront_distribution.url_shortener.hosted_zone_id
    evaluate_target_health = false
  }
}
