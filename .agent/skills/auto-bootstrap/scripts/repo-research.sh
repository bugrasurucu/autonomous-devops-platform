#!/bin/bash
# Repo Research Script — Proje yapısını analiz eder ve mimari gereksinimleri çıkarır
set -euo pipefail

PROJECT_DIR="${1:-.}"
OUTPUT_FILE="${2:-/tmp/repo-research-output.json}"

echo "🔍 Repo araştırması başlıyor: $PROJECT_DIR"

# Dizin ağacını çıkar
echo "📂 Dizin ağacı taranıyor..."
TREE=$(find "$PROJECT_DIR" -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/venv/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  | head -300)

# Proje tipini belirle
detect_project_type() {
  if [ -f "$PROJECT_DIR/package.json" ]; then
    echo "nodejs"
  elif [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/pyproject.toml" ]; then
    echo "python"
  elif [ -f "$PROJECT_DIR/pom.xml" ]; then
    echo "java-maven"
  elif [ -f "$PROJECT_DIR/build.gradle" ] || [ -f "$PROJECT_DIR/build.gradle.kts" ]; then
    echo "java-gradle"
  elif [ -f "$PROJECT_DIR/go.mod" ]; then
    echo "golang"
  elif [ -f "$PROJECT_DIR/Cargo.toml" ]; then
    echo "rust"
  elif [ -f "$PROJECT_DIR/Gemfile" ]; then
    echo "ruby"
  else
    echo "unknown"
  fi
}

# Framework tespiti
detect_framework() {
  local project_type=$1
  case "$project_type" in
    nodejs)
      if grep -q "next" "$PROJECT_DIR/package.json" 2>/dev/null; then echo "nextjs"
      elif grep -q "express" "$PROJECT_DIR/package.json" 2>/dev/null; then echo "express"
      elif grep -q "fastify" "$PROJECT_DIR/package.json" 2>/dev/null; then echo "fastify"
      elif grep -q "nestjs" "$PROJECT_DIR/package.json" 2>/dev/null; then echo "nestjs"
      else echo "generic-node"
      fi ;;
    python)
      if grep -q "django" "$PROJECT_DIR/requirements.txt" 2>/dev/null; then echo "django"
      elif grep -q "fastapi" "$PROJECT_DIR/requirements.txt" 2>/dev/null; then echo "fastapi"
      elif grep -q "flask" "$PROJECT_DIR/requirements.txt" 2>/dev/null; then echo "flask"
      else echo "generic-python"
      fi ;;
    *) echo "generic" ;;
  esac
}

# Veritabanı tespiti
detect_database() {
  local deps=""
  [ -f "$PROJECT_DIR/package.json" ] && deps=$(cat "$PROJECT_DIR/package.json")
  [ -f "$PROJECT_DIR/requirements.txt" ] && deps="$deps $(cat "$PROJECT_DIR/requirements.txt")"

  if echo "$deps" | grep -qi "mongoose\|mongodb\|mongo"; then echo "mongodb"
  elif echo "$deps" | grep -qi "pg\|postgres\|psycopg"; then echo "postgresql"
  elif echo "$deps" | grep -qi "mysql\|mysql2"; then echo "mysql"
  elif echo "$deps" | grep -qi "redis"; then echo "redis"
  elif echo "$deps" | grep -qi "dynamodb\|aws-sdk"; then echo "dynamodb"
  else echo "none"
  fi
}

# Dockerfile kontrolü
HAS_DOCKERFILE=false
[ -f "$PROJECT_DIR/Dockerfile" ] && HAS_DOCKERFILE=true
[ -f "$PROJECT_DIR/docker-compose.yml" ] || [ -f "$PROJECT_DIR/docker-compose.yaml" ] && HAS_DOCKERFILE=true

# Port tespiti
detect_port() {
  if [ -f "$PROJECT_DIR/package.json" ]; then
    grep -oP '"start":\s*".*--port\s+\K\d+' "$PROJECT_DIR/package.json" 2>/dev/null || echo "3000"
  elif [ -f "$PROJECT_DIR/Dockerfile" ]; then
    grep -oP 'EXPOSE\s+\K\d+' "$PROJECT_DIR/Dockerfile" 2>/dev/null | head -1 || echo "8080"
  else
    echo "8080"
  fi
}

# Env değişkenlerini topla
detect_env_vars() {
  if [ -f "$PROJECT_DIR/.env.example" ]; then
    grep -oP '^[A-Z_]+' "$PROJECT_DIR/.env.example" 2>/dev/null | tr '\n' ',' | sed 's/,$//'
  elif [ -f "$PROJECT_DIR/.env.sample" ]; then
    grep -oP '^[A-Z_]+' "$PROJECT_DIR/.env.sample" 2>/dev/null | tr '\n' ',' | sed 's/,$//'
  else
    echo ""
  fi
}

# Test framework tespiti
detect_test_framework() {
  local deps=""
  [ -f "$PROJECT_DIR/package.json" ] && deps=$(cat "$PROJECT_DIR/package.json")
  if echo "$deps" | grep -qi "jest"; then echo "jest"
  elif echo "$deps" | grep -qi "mocha"; then echo "mocha"
  elif echo "$deps" | grep -qi "vitest"; then echo "vitest"
  elif echo "$deps" | grep -qi "pytest"; then echo "pytest"
  else echo "unknown"
  fi
}

PROJECT_TYPE=$(detect_project_type)
FRAMEWORK=$(detect_framework "$PROJECT_TYPE")
DATABASE=$(detect_database)
PORT=$(detect_port)
ENV_VARS=$(detect_env_vars)
TEST_FW=$(detect_test_framework)

# JSON çıktısı oluştur
cat > "$OUTPUT_FILE" << EOF
{
  "project_type": "$PROJECT_TYPE",
  "framework": "$FRAMEWORK",
  "database": "$DATABASE",
  "has_dockerfile": $HAS_DOCKERFILE,
  "port": $PORT,
  "env_vars": "$(echo $ENV_VARS)",
  "test_framework": "$TEST_FW",
  "file_count": $(echo "$TREE" | wc -l | tr -d ' '),
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "estimated_resources": {
    "compute": "ECS Fargate",
    "database": "$([ "$DATABASE" = "mongodb" ] && echo "DocumentDB" || echo "RDS")",
    "networking": "VPC + ALB",
    "storage": "S3"
  }
}
EOF

echo "✅ Repo araştırması tamamlandı: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
