import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketHook {
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  readyState: number;
}

export const useWebSocket = (path: string): WebSocketHook => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/ws${path}`;
    ws.current = new WebSocket(wsUrl);

    const token = localStorage.getItem('token');
    if (token && ws.current) {
      // Stuur auth token bij connectie
      ws.current.onopen = () => {
        ws.current?.send(JSON.stringify({ type: 'AUTH', token }));
      };
    }

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.current.onclose = () => {
      setReadyState(WebSocket.CLOSED);
      // Probeer te reconnecten na 5 seconden
      setTimeout(() => {
        useWebSocket(path);
      }, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.current?.close();
    };

    return () => {
      ws.current?.close();
    };
  }, [path]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  return { lastMessage, sendMessage, readyState };
};