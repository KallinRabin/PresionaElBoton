import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vec: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setActive(true);
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updatePosition(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let finalX = dx;
    let finalY = dy;

    if (dist > maxRadius) {
      finalX = (dx / dist) * maxRadius;
      finalY = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: finalX, y: finalY });
    // Normalize -1 to 1 (inverted Y for standard 3D forward)
    onMove({ x: finalX / maxRadius, y: finalY / maxRadius });
  };

  return (
    <div
      ref={containerRef}
      id="virtual-joystick-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-32 h-32 rounded-none pixel-box-dark bg-black/60 backdrop-blur-none flex items-center justify-center select-none touch-none"
      style={{
        border: '4px solid #38bdf8',
        boxShadow: '0 0 0 2px #000, inset 0 0 0 2px rgba(56, 189, 248, 0.4)',
      }}
    >
      {/* Center crosshair pixel */}
      <div className="absolute w-2 h-2 bg-sky-400/40" />
      <div className="absolute w-8 h-1 bg-sky-400/20" />
      <div className="absolute w-1 h-8 bg-sky-400/20" />

      {/* Joystick Knob */}
      <div
        className="w-14 h-14 pixel-box-blue bg-sky-500 flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          border: '3px solid #000',
        }}
      >
        <div className="w-4 h-4 bg-sky-200" />
      </div>
    </div>
  );
};
