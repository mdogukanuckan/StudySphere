
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import { BASE_URL } from '../api/client';

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, userId } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      setSocket(null);
      return;
    }

    const instance = io(BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [token, userId]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
