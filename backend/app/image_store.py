import uuid
import time
from threading import Lock
from typing import Dict, Optional
import numpy as np

class ImageSession:
    def __init__(self, hdr_image: np.ndarray, filename: str):
        self.id = str(uuid.uuid4())
        self.hdr_image = hdr_image
        self.filename = filename
        self.calibration_factor = 1.0
        self.created_at = time.time()
        self.last_accessed_at = self.created_at

    def get_calibrated_image(self) -> np.ndarray:
        self.last_accessed_at = time.time()
        return self.hdr_image * self.calibration_factor

class ImageStore:
    def __init__(self, max_sessions: int = 16, session_ttl_seconds: int = 3600):
        self._sessions: Dict[str, ImageSession] = {}
        self._max_sessions = max_sessions
        self._session_ttl_seconds = session_ttl_seconds
        self._lock = Lock()

    def _cleanup_expired_sessions(self):
        now = time.time()
        expired_ids = [
            session_id
            for session_id, session in self._sessions.items()
            if (now - session.last_accessed_at) > self._session_ttl_seconds
        ]
        for session_id in expired_ids:
            del self._sessions[session_id]

    def _evict_if_needed(self):
        while len(self._sessions) >= self._max_sessions:
            oldest_session_id = min(
                self._sessions,
                key=lambda session_id: self._sessions[session_id].last_accessed_at
            )
            del self._sessions[oldest_session_id]

    def add_session(self, hdr_image: np.ndarray, filename: str) -> str:
        with self._lock:
            self._cleanup_expired_sessions()
            self._evict_if_needed()
            session = ImageSession(hdr_image, filename)
            self._sessions[session.id] = session
            return session.id

    def get_session(self, session_id: str) -> Optional[ImageSession]:
        with self._lock:
            self._cleanup_expired_sessions()
            session = self._sessions.get(session_id)
            if session:
                session.last_accessed_at = time.time()
            return session

    def remove_session(self, session_id: str):
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]

# Global instance
image_store = ImageStore()
