import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { apiEndpoints } from "../api/api";

const SESSION_KEY = "analytics_session_id";

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);

  if (existing) {
    return existing;
  }

  const sessionId = createSessionId();
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

function AnalyticsTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    const path = location.pathname;

    if (lastTrackedPath.current === path) {
      return;
    }

    lastTrackedPath.current = path;

    apiEndpoints.trackVisit({
      session_id: getSessionId(),
      path,
    }).catch((error) => {
      console.debug("Analytics visit tracking failed.", error);
    });
  }, [location.pathname]);

  return null;
}

export default AnalyticsTracker;
