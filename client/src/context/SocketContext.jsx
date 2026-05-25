import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let activeSocket = null;

    if (user) {
      // Connect to the socket server
      activeSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true
      });

      activeSocket.on('connect', () => {
        console.log('[SOCKET] Connected to real-time server:', activeSocket.id);
        // Identify ourselves to join personal room
        activeSocket.emit('join', user.id);
      });

      activeSocket.on('disconnect', () => {
        console.log('[SOCKET] Disconnected');
      });

      setSocket(activeSocket);
    } else {
      setSocket(null);
    }

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
