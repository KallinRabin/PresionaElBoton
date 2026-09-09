import { ControlMode } from '../types';

/**
 * Detecta de forma fiable si el usuario está accediendo desde un celular / tablet
 * o desde un PC / Laptop.
 */
export function detectIsMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 1. Verificación por User Agent (cubre Android, iOS, Windows Phone, etc.)
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const mobileUARegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|silk|kindle/i;
  if (mobileUARegex.test(ua)) {
    return true;
  }

  // 2. iPadOS en iPads modernos (reporta MacIntel pero tiene puntos táctiles multitouch)
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }

  // 3. Pantallas táctiles primarias con puntero grueso (típico de móviles/tablets sin ratón fino)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const hasNoFinePointer = !window.matchMedia?.('(pointer: fine)').matches;

  if (hasTouch && (hasCoarsePointer || hasNoFinePointer)) {
    return true;
  }

  // 4. Verificación de tamaño de pantalla pequeña con capacidad táctil
  if (hasTouch && Math.min(window.innerWidth, window.innerHeight) <= 768) {
    return true;
  }

  return false;
}

/**
 * Resuelve si se deben activar los controles móviles según la preferencia guardada
 * o la detección automática.
 */
export function resolveIsMobile(controlMode: ControlMode = 'auto'): boolean {
  if (controlMode === 'mobile') return true;
  if (controlMode === 'pc') return false;
  return detectIsMobile();
}

/**
 * Comprueba si la ventana ya está en modo pantalla completa.
 */
export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Activa la pantalla completa. Debe ser invocado durante una interacción del usuario.
 */
export function enterFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (isFullscreenActive()) return Promise.resolve();

  const docEl = document.documentElement as any;
  const requestMethod =
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen;

  if (requestMethod) {
    try {
      const res = requestMethod.call(docEl);
      if (res && typeof res.catch === 'function') {
        return res.catch(() => {});
      }
    } catch (e) {
      // Browsers block fullscreen if not within user gesture
    }
  }
  return Promise.resolve();
}

/**
 * Sale del modo pantalla completa.
 */
export function exitFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!isFullscreenActive()) return Promise.resolve();

  const doc = document as any;
  const exitMethod =
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen;

  if (exitMethod) {
    try {
      const res = exitMethod.call(doc);
      if (res && typeof res.catch === 'function') {
        return res.catch(() => {});
      }
    } catch (e) {
      // Ignored
    }
  }
  return Promise.resolve();
}
