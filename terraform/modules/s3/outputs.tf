output "bucket_name" {
  value = aws_s3_bucket.testmgr_storage.id
}

output "bucket_arn" {
  value = aws_s3_bucket.testmgr_storage.arn
}

output "bucket_domain_name" {
  value = aws_s3_bucket.testmgr_storage.bucket_domain_name
}
