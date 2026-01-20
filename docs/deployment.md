# Deployment

## Terraform

```bash
cd infra/terraform
terraform init
terraform apply -var="database_url=postgresql://..." -var="redis_url=redis://..."
```

Outputs:
- `backend_url` (ALB DNS)
- `ecr_repository`
- `ecs_cluster`
- `ecs_service`

## ECS Task Definition Template

Update `infra/ecs-task-definition.json` if you change:
- SSM parameter paths (default `/uk2me/*`)
- AWS region (default `eu-west-1`)
- Log group naming

## CI/CD Flow
1) GitHub Actions builds backend image.
2) Pushes to ECR.
3) Renders new task definition.
4) Deploys to ECS service with rolling update.

## GitHub OIDC
Create an IAM role with the trust policy for GitHub OIDC and attach the policy in `infra/iam-policy.json`.
Set `AWS_ROLE_TO_ASSUME` in GitHub secrets.
