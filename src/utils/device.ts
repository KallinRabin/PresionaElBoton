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
