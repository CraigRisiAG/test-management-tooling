# CloudWatch Module for test-management-tooling

# Log Group for ECS containers
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/aws/ecs/testmgr-${var.environment}"
  retention_in_days = var.log_retention_days
  
  tags = {
    Name = "testmgr-ecs-logs-${var.environment}"
  }
}

# Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "testmgr-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ECS Resource Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "DynamoDB Capacity"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '/aws/ecs/testmgr-${var.environment}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region  = data.aws_region.current.name
          title   = "Recent Logs"
        }
      }
    ]
  })
}

# Alarm: High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "testmgr-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = "testmgr-cluster-${var.environment}"
  }
}

# Alarm: High Memory
resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "testmgr-${var.environment}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS memory utilization"
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = "testmgr-cluster-${var.environment}"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "testmgr-alerts-${var.environment}"
  
  tags = {
    Name = "testmgr-alerts-${var.environment}"
  }
}

# SNS Topic subscription (email)
resource "aws_sns_topic_subscription" "alerts_email" {
  count     = length(var.alert_emails)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

data "aws_region" "current" {}
