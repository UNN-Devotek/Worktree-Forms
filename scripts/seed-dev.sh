#!/usr/bin/env bash
# =============================================================================
# seed-dev.sh — Idempotent local development seed script
# Replaces the old Prisma seed with DynamoDB + LocalStack S3 setup.
# Run: bash scripts/seed-dev.sh
# Safe to re-run at any time — uses ConditionExpression to skip existing items.
# =============================================================================
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8100}"
TABLE="${DYNAMODB_TABLE_NAME:-worktree-local}"
AUTH_TABLE="${DYNAMODB_AUTH_TABLE_NAME:-worktree-auth-local}"
S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:4510}"
S3_BUCKET="${S3_BUCKET:-worktree-local}"
REGION="${AWS_REGION:-us-east-1}"

# bcrypt hash of "password" (10 rounds) — for dev users only
PASS_HASH='$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u'

NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           Worktree Dev Environment Seed              ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  DynamoDB:  ${ENDPOINT}"
echo "║  LocalStack: ${S3_ENDPOINT}"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: S3 Bucket ────────────────────────────────────────────────────────
echo "[ 1/5 ] Creating S3 bucket: ${S3_BUCKET}..."
aws s3 mb "s3://${S3_BUCKET}" \
  --endpoint-url "${S3_ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Bucket created" || echo "  ✓ Bucket already exists"

# ─── Step 2a: Main app DynamoDB table ─────────────────────────────────────────
echo "[ 2/5 ] Creating DynamoDB table: ${TABLE}..."
aws dynamodb create-table \
  --table-name "${TABLE}" \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --global-secondary-indexes '[
    {
      "IndexName": "GSI1",
      "KeySchema": [
        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
        {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Table created" || echo "  ✓ Table already exists"

# Enable TTL on main table
aws dynamodb update-time-to-live \
  --table-name "${TABLE}" \
  --time-to-live-specification "Enabled=true,AttributeName=ttl" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null || true

# ─── Step 2b: Auth DynamoDB table ─────────────────────────────────────────────
echo "[ 2b ] Creating auth table: ${AUTH_TABLE}..."
aws dynamodb create-table \
  --table-name "${AUTH_TABLE}" \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --global-secondary-indexes '[
    {
      "IndexName": "GSI1",
      "KeySchema": [
        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
        {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Auth table created" || echo "  ✓ Auth table already exists"

# Enable TTL on auth table (for session expiry)
aws dynamodb update-time-to-live \
  --table-name "${AUTH_TABLE}" \
  --time-to-live-specification "Enabled=true,AttributeName=expires" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null || true

# ─── Step 3: Seed dev users ───────────────────────────────────────────────────
echo "[ 3/5 ] Seeding dev users..."

ADMIN_ID="user_admin_dev_00001"
USER_ID="user_member_dev_00001"

# Admin user
aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{
    \"PK\":{\"S\":\"USER#${ADMIN_ID}\"},
    \"SK\":{\"S\":\"USER\"},
    \"GSI1PK\":{\"S\":\"admin@worktree.pro\"},
    \"GSI1SK\":{\"S\":\"USER\"},
    \"userId\":{\"S\":\"${ADMIN_ID}\"},
    \"email\":{\"S\":\"admin@worktree.pro\"},
    \"name\":{\"S\":\"Admin User\"},
    \"passwordHash\":{\"S\":\"${PASS_HASH}\"},
    \"role\":{\"S\":\"ADMIN\"},
    \"theme\":{\"S\":\"system\"},
    \"locale\":{\"S\":\"en\"},
    \"createdAt\":{\"S\":\"${NOW}\"},
    \"updatedAt\":{\"S\":\"${NOW}\"}
  }" \
  --condition-expression "attribute_not_exists(PK)" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Admin user seeded" || echo "  ✓ Admin user already exists"

# Member user
aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{
    \"PK\":{\"S\":\"USER#${USER_ID}\"},
    \"SK\":{\"S\":\"USER\"},
    \"GSI1PK\":{\"S\":\"user@worktree.com\"},
    \"GSI1SK\":{\"S\":\"USER\"},
    \"userId\":{\"S\":\"${USER_ID}\"},
    \"email\":{\"S\":\"user@worktree.com\"},
    \"name\":{\"S\":\"Test User\"},
    \"passwordHash\":{\"S\":\"${PASS_HASH}\"},
    \"role\":{\"S\":\"USER\"},
    \"theme\":{\"S\":\"system\"},
    \"locale\":{\"S\":\"en\"},
    \"createdAt\":{\"S\":\"${NOW}\"},
    \"updatedAt\":{\"S\":\"${NOW}\"}
  }" \
  --condition-expression "attribute_not_exists(PK)" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Member user seeded" || echo "  ✓ Member user already exists"

# ─── Step 4: Seed sample project ─────────────────────────────────────────────
echo "[ 4/5 ] Seeding sample project..."

PROJECT_ID="proj_sample_dev_00001"

# Project record
aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{
    \"PK\":{\"S\":\"PROJECT#${PROJECT_ID}\"},
    \"SK\":{\"S\":\"PROJECT\"},
    \"GSI1PK\":{\"S\":\"sample-project\"},
    \"GSI1SK\":{\"S\":\"PROJECT\"},
    \"projectId\":{\"S\":\"${PROJECT_ID}\"},
    \"slug\":{\"S\":\"sample-project\"},
    \"name\":{\"S\":\"Sample Project\"},
    \"description\":{\"S\":\"Development seed project\"},
    \"ownerId\":{\"S\":\"${ADMIN_ID}\"},
    \"storageUsedBytes\":{\"N\":\"0\"},
    \"storageQuotaBytes\":{\"N\":\"10737418240\"},
    \"createdAt\":{\"S\":\"${NOW}\"},
    \"updatedAt\":{\"S\":\"${NOW}\"}
  }" \
  --condition-expression "attribute_not_exists(PK)" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Project seeded" || echo "  ✓ Project already exists"

# Admin as OWNER member
aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{
    \"PK\":{\"S\":\"PROJECT#${PROJECT_ID}\"},
    \"SK\":{\"S\":\"MEMBER#${ADMIN_ID}\"},
    \"GSI1PK\":{\"S\":\"USER#${ADMIN_ID}\"},
    \"GSI1SK\":{\"S\":\"PROJECT#${PROJECT_ID}\"},
    \"projectId\":{\"S\":\"${PROJECT_ID}\"},
    \"userId\":{\"S\":\"${ADMIN_ID}\"},
    \"email\":{\"S\":\"admin@worktree.pro\"},
    \"roles\":{\"L\":[{\"S\":\"OWNER\"}]},
    \"joinedAt\":{\"S\":\"${NOW}\"}
  }" \
  --condition-expression "attribute_not_exists(SK)" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Admin membership seeded" || echo "  ✓ Admin membership already exists"

# User as MEMBER
aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{
    \"PK\":{\"S\":\"PROJECT#${PROJECT_ID}\"},
    \"SK\":{\"S\":\"MEMBER#${USER_ID}\"},
    \"GSI1PK\":{\"S\":\"USER#${USER_ID}\"},
    \"GSI1SK\":{\"S\":\"PROJECT#${PROJECT_ID}\"},
    \"projectId\":{\"S\":\"${PROJECT_ID}\"},
    \"userId\":{\"S\":\"${USER_ID}\"},
    \"email\":{\"S\":\"user@worktree.com\"},
    \"roles\":{\"L\":[{\"S\":\"VIEWER\"}]},
    \"joinedAt\":{\"S\":\"${NOW}\"}
  }" \
  --condition-expression "attribute_not_exists(SK)" \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ Member membership seeded" || echo "  ✓ Member membership already exists"

# S3 project folder
aws s3api put-object \
  --bucket "${S3_BUCKET}" \
  --key "projects/${PROJECT_ID}/.keep" \
  --body /dev/null \
  --endpoint-url "${S3_ENDPOINT}" \
  --region "${REGION}" 2>/dev/null && echo "  ✓ S3 project folder created" || echo "  ✓ S3 project folder already exists"

# ─── Step 5: Done ─────────────────────────────────────────────────────────────
echo ""
echo "[ 5/5 ] Seed complete!"
echo ""
echo "  Dev credentials:"
echo "    Admin:   admin@worktree.pro  / password"
echo "    Member:  user@worktree.com   / password"
echo ""
echo "  DynamoDB Admin UI: http://localhost:8101"
echo "  App:               http://localhost:3005"
echo ""
