import React, { createContext, useContext, useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children, onTripCreated, onTripUpdated, onTripDeleted, onLocationUpdated }) {
  const handlersRef = useRef({ onTripCreated, onTripUpdated, onTripDeleted, onLocationUpdated });
  handlersRef.current = { onTripCreated, onTripUpdated, onTripDeleted, onLocationUpdated };

  useEffect(() => {
    const socket = getSocket();
    const on = (event, fn) => socket.on(event, (...args) => fn?.(...args));

    on('trip:created',      ({ trip })   => handlersRef.current.onTripCreated?.(trip));
    on('trip:updated',      ({ trip })   => handlersRef.current.onTripUpdated?.(trip));
    on('trip:deleted',      ({ tripId }) => handlersRef.current.onTripDeleted?.(tripId));
    on('location:updated',  (data)       => handlersRef.current.onLocationUpdated?.(data));

    return () => {
      socket.off('trip:created');
      socket.off('trip:updated');
      socket.off('trip:deleted');
      socket.off('location:updated');
    };
  }, []);

  return <SocketContext.Provider value={null}>{children}</SocketContext.Provider>;
}
