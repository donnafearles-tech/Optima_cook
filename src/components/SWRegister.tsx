'use client';

import { useEffect } from 'react';

export function SWRegister() {
  useEffect(() => {
    // Solo ejecutamos esto en el navegador (no en el servidor)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('✅ Service Worker registrado con éxito:', reg))
        .catch((err) => console.error('❌ Error al registrar Service Worker:', err));
    }
  }, []);

  return null; // Este componente no muestra nada visualmente
}