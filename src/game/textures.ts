import * as THREE from 'three';

/**
 * Procedural Pixel Art Texture Generator
 * Uses NearestFilter and no mipmaps to guarantee crisp, retro pixelated rendering.
 */

// Helper to create a canvas-based pixel texture
function createPixelTexture(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, width, height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 1. Arena Floor Checkerboard
export function getFloorTexture(theme: 'arcade' | 'cyber' | 'stone' = 'arcade'): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    if (theme === 'arcade') {
      // Dark slate + vibrant indigo checkerboard with pixel border
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const isCheck = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
          ctx.fillStyle = isCheck ? '#2e1065' : '#1e1b4b';
          ctx.fillRect(x, y, 1, 1);
          // Pixel grid border
          if (x === 0 || y === 0 || x === 8 || y === 8) {
            ctx.fillStyle = isCheck ? '#4338ca' : '#0f172a';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    } else if (theme === 'cyber') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(7, 7, 2, 2);
    } else {
      // Stone
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(7, 0, 1, 8);
      ctx.fillRect(15, 8, 1, 8);
      ctx.fillStyle = '#52525b';
      ctx.fillRect(1, 1, 2, 1);
      ctx.fillRect(9, 9, 2, 1);
    }
  });
}

// 2. Hazard Stripes (Yellow / Black pixel art)
export function getHazardTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#eab308'; // retro yellow
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#18181b'; // dark stripe
    for (let i = -16; i < 32; i += 8) {
      ctx.beginPath();
      for (let y = 0; y < 16; y++) {
        const x = (i + y) % 16;
        const xPositive = (x + 16) % 16;
        for (let w = 0; w < 4; w++) {
          ctx.fillRect((xPositive + w) % 16, y, 1, 1);
        }
      }
    }
    // High contrast pixel border
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 15, 16, 1);
  });
}

// 3. Wall Pixel Brick Texture
export function getWallTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 16, 16);
    // Pixel brick lines
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(8, 0, 1, 8);
    ctx.fillRect(0, 8, 1, 8);
    // Highlights
    ctx.fillStyle = '#4338ca';
    ctx.fillRect(1, 1, 6, 1);
    ctx.fillRect(9, 9, 6, 1);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(2, 3, 4, 3);
  });
}

// 4. Platform Edge & Surface Texture
export function getPlatformTexture(color: string = '#8b5cf6'): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
    // Border inset
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(1, 1, 14, 1);
    ctx.fillRect(1, 1, 1, 14);
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(1, 14, 14, 1);
    ctx.fillRect(14, 1, 1, 14);
    ctx.globalAlpha = 1.0;
  });
}

// 5. Giant Button Top Texture with Pixel Icon
export function getButtonCapTexture(themeColor: string = '#ef4444'): THREE.CanvasTexture {
  return createPixelTexture(32, 32, (ctx) => {
    // Base dome color
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, 32, 32);

    // Bevel highlights & shadows
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(2, 2, 28, 3);
    ctx.fillRect(2, 2, 3, 28);
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(2, 27, 28, 3);
    ctx.fillRect(27, 2, 3, 28);
    ctx.globalAlpha = 1.0;

    // Center pixel star / hand / button emblem
    ctx.fillStyle = '#fef08a';
    // Star / Crown shape in pixel art
    const emblem = [
      '    ██    ',
      '  ██████  ',
      '██  ██  ██',
      '██████████',
      '  ██████  ',
      '  ██  ██  ',
      '  ██  ██  '
    ];
    emblem.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === '█') {
          ctx.fillRect(11 + rx, 12 + ry, 1, 1);
        }
      }
    });
  });
}

// 6. Coin Texture
export function getCoinTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(3, 1, 10, 14);
    ctx.fillRect(1, 3, 14, 10);

    // Border
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 0, 8, 1);
    ctx.fillRect(4, 15, 8, 1);
    ctx.fillRect(0, 4, 1, 8);
    ctx.fillRect(15, 4, 1, 8);

    // Highlight
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(3, 3, 4, 2);
    ctx.fillRect(3, 5, 2, 4);

    // Dollar/Star in center
    ctx.fillStyle = '#b45309';
    ctx.fillRect(7, 4, 2, 8);
    ctx.fillRect(5, 6, 6, 1);
    ctx.fillRect(5, 9, 6, 1);
  });
}

// 7. Jump / Bounce Pad Texture
export function getBouncePadTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 16, 16);

    // Concentric rings
    ctx.fillStyle = '#065f46';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(3, 3, 10, 10);
    ctx.fillStyle = '#059669';
    ctx.fillRect(5, 5, 6, 6);

    // Up arrows in center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 6, 2, 4);
    ctx.fillRect(6, 7, 4, 1);
    ctx.fillRect(5, 8, 6, 1);
  });
}

// 8. 3D Floating Pixel Billboard / Label Texture (for "¡PULSA!" and "RECARGANDO...")
export function createPixelBillboardTexture(
  text: string,
  bgColor: string,
  textColor: string,
  subText?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;

    // Pixel Box Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 80);

    ctx.fillStyle = bgColor;
    ctx.fillRect(4, 4, 248, 72);

    // Inset borders
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.35;
    ctx.fillRect(6, 6, 244, 4);
    ctx.fillRect(6, 6, 4, 68);
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(6, 70, 244, 4);
    ctx.fillRect(246, 6, 4, 68);
    ctx.globalAlpha = 1.0;

    // Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow
    ctx.fillText(text, 128 + 2, 38 + 2);

    // Main text
    ctx.fillStyle = textColor;
    ctx.fillText(text, 128, 38);

    if (subText) {
      ctx.font = 'bold 12px "Silkscreen", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subText, 128, 62);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

// 9. Character Pixel Texture (Face and torso mapping)
export function getCharacterFaceTexture(skinId: string, color: string): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);

    // Pixel Eyes & Face detail based on skin
    if (skinId.includes('ninja')) {
      // Dark ninja mask with glowing red/cyan eyes
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 16, 7);
      ctx.fillRect(0, 11, 16, 5);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(3, 8, 3, 2);
      ctx.fillRect(10, 8, 3, 2);
    } else if (skinId.includes('robot')) {
      // Screen face with pixel eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(4, 5, 2, 3);
      ctx.fillRect(10, 5, 2, 3);
      ctx.fillRect(5, 10, 6, 1);
    } else if (skinId.includes('dino')) {
      // Cute dino eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, 5, 2, 3);
      ctx.fillRect(11, 5, 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 5, 1, 1);
      ctx.fillRect(11, 5, 1, 1);
      // Snout
      ctx.fillStyle = '#15803d';
      ctx.fillRect(5, 9, 6, 4);
    } else {
      // Classic pixel hero face
      // Hair/helmet top
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, 16, 4);
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(3, 6, 2, 3);
      ctx.fillRect(11, 6, 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 6, 1, 1);
      ctx.fillRect(11, 6, 1, 1);
      // Smile
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(6, 11, 4, 1);
      ctx.fillRect(5, 10, 1, 1);
      ctx.fillRect(10, 10, 1, 1);
    }
  });
}
