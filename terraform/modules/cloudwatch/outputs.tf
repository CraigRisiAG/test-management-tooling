output "log_group_name" {
  value = aws_cloudwatch_log_group.ecs_logs.name
}

output "log_group_arn" {
  value = aws_cloudwatch_log_group.ecs_logs.arn
}

output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "dashboard_arn" {
  value = aws_cloudwatch_dashboard.main.dashboard_arn
}
