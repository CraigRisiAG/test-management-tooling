output "table_name" {
  value = aws_dynamodb_table.testmgr_data.name
}

output "table_arn" {
  value = aws_dynamodb_table.testmgr_data.arn
}

output "table_stream_arn" {
  value = aws_dynamodb_table.testmgr_data.stream_arn
}
