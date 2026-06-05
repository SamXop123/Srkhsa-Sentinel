import { useState, useEffect, useRef } from "react";
import { AgentExecutionLog } from "../../../shared/types/agents";

export const useAgentLogs = (circularId: string | null) => {
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!circularId) {
      setLogs([]);
      return;
    }

    // Connect to FastAPI logs broadcast
    const wsUrl = `ws://localhost:8000/ws/agents/logs?circular_id=${circularId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected to agent logs stream");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as AgentExecutionLog;
        setLogs((prev) => [...prev, payload]);
      } catch (err) {
        console.error("Failed to parse log message: ", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket connection error: ", err);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [circularId]);

  const clearLogs = () => setLogs([]);

  return { logs, isConnected, clearLogs };
};
