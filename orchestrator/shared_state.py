"""
Shared State (Master Clipboard) — Ajanlar Arası Paylaşılan Durum Yönetimi

Orkestratör ajan "Proje Yöneticisi" olarak bu paylaşılan durumu tutar.
İşçi ajanlar (Infra, Pipeline, FinOps, SRE) durumsuz (stateless) çalışır
ve çıktılarını bu sisteme yazar.

Tüm yazma işlemleri append-only loga kaydedilir (audit trail).
"""

import json
import threading
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class StateEntry:
    """Durum kaydı"""
    key: str
    value: Any
    written_by: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MasterClipboard:
    """
    Master Clipboard — Ana Pano
    
    A2A protokolünde session.state objesi olarak görev yapar.
    Thread-safe okuma/yazma operasyonları destekler.
    """

    def __init__(self):
        self._state: dict[str, Any] = {}
        self._lock = threading.RLock()
        self._audit_log: list[StateEntry] = []

    def write(self, agent_id: str, data: dict) -> None:
        """
        Ajan çıktısını paylaşılan duruma yaz.
        Append-only audit log ile kayıt altına alınır.
        """
        with self._lock:
            entry = StateEntry(
                key=agent_id,
                value=data,
                written_by=agent_id,
            )
            self._state[agent_id] = data
            self._audit_log.append(entry)

    def read(self, key: str) -> Optional[Any]:
        """Belirli bir anahtarı oku"""
        with self._lock:
            return self._state.get(key)

    def read_all(self) -> dict:
        """Tüm durumu oku"""
        with self._lock:
            return dict(self._state)

    def get_audit_log(self) -> list[dict]:
        """Denetim logunu döndür"""
        with self._lock:
            return [
                {
                    "key": entry.key,
                    "written_by": entry.written_by,
                    "timestamp": entry.timestamp,
                    "value_preview": str(entry.value)[:200],
                }
                for entry in self._audit_log
            ]

    def clear(self) -> None:
        """Durumu temizle (yeni proje için)"""
        with self._lock:
            self._state.clear()
            self._audit_log.append(StateEntry(
                key="__system__",
                value={"action": "state_cleared"},
                written_by="orchestrator",
            ))


class SharedState:
    """
    Paylaşılan Durum — Genel amaçlı durum yönetimi
    
    Ajan logları, metrikler ve geçici veriler için kullanılır.
    """

    def __init__(self):
        self._logs: list[dict] = []
        self._metrics: dict[str, list] = {}
        self._lock = threading.RLock()

    def append_log(self, agent_id: str, message: str, level: str = "INFO") -> None:
        """Ajan log kaydı ekle"""
        with self._lock:
            self._logs.append({
                "agent": agent_id,
                "message": message,
                "level": level,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

    def get_logs(self, agent_id: Optional[str] = None, limit: int = 100) -> list[dict]:
        """Logları oku (opsiyonel ajan filtresi)"""
        with self._lock:
            logs = self._logs
            if agent_id:
                logs = [log for log in logs if log["agent"] == agent_id]
            return logs[-limit:]

    def record_metric(self, name: str, value: float, agent_id: str = "system") -> None:
        """Metrik kaydet"""
        with self._lock:
            if name not in self._metrics:
                self._metrics[name] = []
            self._metrics[name].append({
                "value": value,
                "agent": agent_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

    def get_metrics(self, name: str) -> list[dict]:
        """Metrik oku"""
        with self._lock:
            return self._metrics.get(name, [])

    def export_state(self) -> dict:
        """Tüm durumu JSON olarak dışa aktar"""
        with self._lock:
            return {
                "logs": self._logs[-50:],
                "metrics": {k: v[-20:] for k, v in self._metrics.items()},
                "exported_at": datetime.now(timezone.utc).isoformat(),
            }
