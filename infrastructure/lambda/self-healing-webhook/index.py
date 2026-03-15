"""

Self-Healing Webhook — Lambda Fonksiyonu

CloudWatch Alarm → EventBridge → Bu Lambda tetiklenir.
Log toplar, kök neden analizi yapar ve otonom iyileştirme uygular.

Sense → Analyze → Act → Verify döngüsünün otomatik tetikleme noktası.
"""

import json
import os
import logging
from datetime import datetime, timezone, timedelta

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS istemcileri
ecs_client = boto3.client("ecs")
cloudwatch_client = boto3.client("cloudwatch")
logs_client = boto3.client("logs")
sns_client = boto3.client("sns")

# Ortam değişkenleri
PROJECT_NAME = os.environ.get("PROJECT_NAME", "app")
ECS_CLUSTER = os.environ.get("ECS_CLUSTER", "")
ECS_SERVICE = os.environ.get("ECS_SERVICE", "")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "production")

# Self-healing sınırları
MAX_REMEDIATION_PER_HOUR = 5
remediation_count = 0


def lambda_handler(event, context):
    """
    Ana Lambda handler — EventBridge'den gelen CloudWatch alarm olaylarını işler.
    
    Self-Healing döngüsü:
    1. Sense: Alarm bilgilerini topla
    2. Analyze: Log ve metrik analizi
    3. Act: Otonom iyileştirme
    4. Verify: Sistem durumunu doğrula
    """
    logger.info(f"🚨 Self-Healing webhook tetiklendi: {json.dumps(event, default=str)}")

    try:
        # 1. SENSE — Alarm bilgilerini çıkar
        alarm_info = extract_alarm_info(event)
        logger.info(f"📊 Alarm: {alarm_info['alarm_name']} | Tür: {alarm_info['alarm_type']}")

        # 2. ANALYZE — Kök neden analizi
        rca = analyze_root_cause(alarm_info)
        logger.info(f"🔍 RCA: {rca['root_cause']} | Güven: {rca['confidence']}")

        # 3. ACT — Otonom iyileştirme
        remediation = execute_remediation(rca)
        logger.info(f"🔧 Aksiyon: {remediation['action']} | Sonuç: {remediation['result']}")

        # 4. VERIFY — Doğrulama
        verification = verify_health()
        logger.info(f"✅ Doğrulama: {verification['status']}")

        # Raporlama
        report = {
            "incident_id": f"INC-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
            "alarm": alarm_info,
            "rca": rca,
            "remediation": remediation,
            "verification": verification,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # SNS ile bildirim
        send_notification(report)

        return {
            "statusCode": 200,
            "body": json.dumps(report, default=str),
        }

    except Exception as e:
        logger.error(f"❌ Self-healing hatası: {str(e)}")
        send_notification({
            "error": str(e),
            "event": event,
            "action": "ESCALATE_TO_HUMAN",
        })
        raise


def extract_alarm_info(event: dict) -> dict:
    """Alarm bilgilerini EventBridge olayından çıkar"""
    detail = event.get("detail", {})

    alarm_name = detail.get("alarmName", "unknown")
    alarm_type = "unknown"

    if "cpu" in alarm_name.lower():
        alarm_type = "high_cpu"
    elif "memory" in alarm_name.lower():
        alarm_type = "high_memory"
    elif "5xx" in alarm_name.lower():
        alarm_type = "http_errors"
    elif "task-count" in alarm_name.lower():
        alarm_type = "task_failure"

    return {
        "alarm_name": alarm_name,
        "alarm_type": alarm_type,
        "state": detail.get("state", {}).get("value", "ALARM"),
        "reason": detail.get("state", {}).get("reason", ""),
        "timestamp": detail.get("state", {}).get("timestamp", ""),
    }


def analyze_root_cause(alarm_info: dict) -> dict:
    """Basit kök neden analizi — metrik ve log korelasyonu"""

    alarm_type = alarm_info["alarm_type"]
    confidence = 0.0
    root_cause = "unknown"
    recommended_action = "none"

    # Metrik tabanlı analiz
    if alarm_type == "high_cpu":
        root_cause = "CPU kullanımı eşiği aştı — olası trafik artışı veya CPU-intensive işlem"
        recommended_action = "scale_out"
        confidence = 0.75

    elif alarm_type == "high_memory":
        root_cause = "Bellek kullanımı kritik seviyede — olası memory leak"
        recommended_action = "restart_tasks"
        confidence = 0.70

    elif alarm_type == "http_errors":
        root_cause = "5xx hata oranı yüksek — olası deployment hatası veya downstream servis arızası"
        recommended_action = "check_recent_deployment"
        confidence = 0.65

    elif alarm_type == "task_failure":
        root_cause = "ECS task'lar çöktü — container health check başarısız"
        recommended_action = "force_new_deployment"
        confidence = 0.80

    # Son logları kontrol et
    try:
        recent_errors = get_recent_errors()
        if recent_errors:
            root_cause += f" | Son hata: {recent_errors[0][:200]}"
            confidence = min(confidence + 0.1, 0.95)
    except Exception as e:
        logger.warning(f"Log analizi başarısız: {e}")

    return {
        "root_cause": root_cause,
        "recommended_action": recommended_action,
        "confidence": confidence,
        "alarm_type": alarm_type,
    }


def get_recent_errors() -> list:
    """Son 30 dakikanın hata loglarını çek"""
    try:
        now = datetime.now(timezone.utc)
        start_time = int((now - timedelta(minutes=30)).timestamp() * 1000)
        end_time = int(now.timestamp() * 1000)

        response = logs_client.filter_log_events(
            logGroupName=f"/ecs/{PROJECT_NAME}",
            startTime=start_time,
            endTime=end_time,
            filterPattern="ERROR",
            limit=10,
        )

        return [event["message"] for event in response.get("events", [])]
    except Exception:
        return []


def execute_remediation(rca: dict) -> dict:
    """Otonom iyileştirme aksiyonları"""
    global remediation_count

    action = rca["recommended_action"]
    result = "skipped"

    # Güvenlik kontrolü — saatte maksimum 5 aksiyon
    if remediation_count >= MAX_REMEDIATION_PER_HOUR:
        logger.warning("⚠️ Saatlik iyileştirme limiti aşıldı — escalation yapılıyor")
        return {
            "action": "ESCALATED",
            "result": "hourly_limit_exceeded",
            "detail": f"Limit: {MAX_REMEDIATION_PER_HOUR}/saat",
        }

    try:
        if action == "scale_out":
            # ECS desired count artır
            current = get_current_desired_count()
            new_count = min(current + 2, 10)  # Maksimum 10
            ecs_client.update_service(
                cluster=ECS_CLUSTER,
                service=ECS_SERVICE,
                desiredCount=new_count,
            )
            result = f"scaled_from_{current}_to_{new_count}"
            remediation_count += 1

        elif action == "restart_tasks":
            # Force new deployment
            ecs_client.update_service(
                cluster=ECS_CLUSTER,
                service=ECS_SERVICE,
                forceNewDeployment=True,
            )
            result = "force_new_deployment_triggered"
            remediation_count += 1

        elif action == "force_new_deployment":
            ecs_client.update_service(
                cluster=ECS_CLUSTER,
                service=ECS_SERVICE,
                forceNewDeployment=True,
            )
            result = "force_new_deployment_triggered"
            remediation_count += 1

        elif action == "check_recent_deployment":
            # Son deployment'ı kontrol et — rollback gerekebilir
            result = "deployment_check_required_human_review"

        else:
            result = "no_action_taken"

    except Exception as e:
        result = f"remediation_failed: {str(e)}"
        logger.error(f"İyileştirme hatası: {e}")

    return {
        "action": action,
        "result": result,
        "remediation_count": remediation_count,
    }


def get_current_desired_count() -> int:
    """ECS service mevcut desired count"""
    try:
        response = ecs_client.describe_services(
            cluster=ECS_CLUSTER,
            services=[ECS_SERVICE],
        )
        services = response.get("services", [])
        if services:
            return services[0].get("desiredCount", 2)
    except Exception:
        pass
    return 2


def verify_health() -> dict:
    """İyileştirme sonrası durum doğrulaması"""
    try:
        response = ecs_client.describe_services(
            cluster=ECS_CLUSTER,
            services=[ECS_SERVICE],
        )
        services = response.get("services", [])
        if services:
            service = services[0]
            running = service.get("runningCount", 0)
            desired = service.get("desiredCount", 0)

            return {
                "status": "healthy" if running >= desired else "degraded",
                "running_tasks": running,
                "desired_tasks": desired,
                "deployments": len(service.get("deployments", [])),
            }
    except Exception as e:
        return {"status": "check_failed", "error": str(e)}

    return {"status": "unknown"}


def send_notification(report: dict) -> None:
    """SNS ile bildirim gönder"""
    if not SNS_TOPIC_ARN:
        logger.warning("SNS_TOPIC_ARN tanımlı değil — bildirim atlandı")
        return

    try:
        subject = f"🚨 Self-Healing | {report.get('incident_id', 'unknown')} | {ENVIRONMENT}"
        message = json.dumps(report, indent=2, default=str, ensure_ascii=False)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],
            Message=message,
        )
        logger.info("📧 Bildirim gönderildi")
    except Exception as e:
        logger.error(f"Bildirim hatası: {e}")
