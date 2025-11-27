import uuid
from typing import Dict, Optional
import numpy as np

class ImageSession:
    def __init__(self, hdr_image: np.ndarray, filename: str):
        self.id = str(uuid.uuid4())
        self.hdr_image = hdr_image
        self.filename = filename
        self.calibration_factor = 1.0

    def get_calibrated_image(self) -> np.ndarray:
        return self.hdr_image * self.calibration_factor

class ImageStore:
    def __init__(self):
        self._sessions: Dict[str, ImageSession] = {}

    def add_session(self, hdr_image: np.ndarray, filename: str) -> str:
        session = ImageSession(hdr_image, filename)
        self._sessions[session.id] = session
        return session.id

    def get_session(self, session_id: str) -> Optional[ImageSession]:
        return self._sessions.get(session_id)

    def remove_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

# Global instance
image_store = ImageStore()
