output "api_id" {
  value = aws_apigatewayv2_api.main.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "api_arn" {
  value = aws_apigatewayv2_api.main.arn
}

output "stage_id" {
  value = aws_apigatewayv2_stage.default.id
}

output "vpc_link_id" {
  value = aws_apigatewayv2_vpc_link.main.id
}

output "custom_domain_name" {
  value = var.custom_domain_name != "" ? aws_apigatewayv2_domain_name.main[0].domain_name : ""
}
