import React, { useRef, useEffect } from 'react';

// Living Ecosystem: 3D chat bubbles with mesh gradients and physics
const BUBBLES = [
  { text: 'Book appointment', color: '#6366F1' },
  { text: 'View menu', color: '#7C3AED' },
  { text: 'Confirm booking ✅', color: '#22D3EE' },
  { text: 'See analytics', color: '#EC4899' },
  { text: 'Contact staff', color: '#10B981' },
  { text: 'Get reminder', color: '#F59E42' },
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Landing5({ onNavigate }) {
  const canvasRef = useRef();
  const bubblesRef = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    // Bubble state
    const bubbles = BUBBLES.map((b, i) => ({
      ...b,
      x: width / 2 + Math.cos((i / BUBBLES.length) * Math.PI * 2) * 220 + randomBetween(-40, 40),
      y: height / 2 + Math.sin((i / BUBBLES.length) * Math.PI * 2) * 120 + randomBetween(-40, 40),
      vx: 0, vy: 0,
      ox: 0, oy: 0,
      r: 70 + randomBetween(-10, 10),
    }));
    bubbles.forEach(b => { b.ox = b.x; b.oy = b.y; });
    bubblesRef.current = bubbles;

    function drawMeshGradient() {
      // Mesh gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#4F46E5');
      grad.addColorStop(0.5, '#7C3AED');
      grad.addColorStop(1, '#EC4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      // Overlay blur
      ctx.globalAlpha = 0.18;
      ctx.filter = 'blur(60px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    }

    function drawCentralOrb() {
      const orbX = width / 2, orbY = height / 2;
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 120);
      orbGrad.addColorStop(0, '#A5F3FC');
      orbGrad.addColorStop(0.5, '#22D3EE');
      orbGrad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 120, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = orbGrad;
      ctx.fill();
      ctx.restore();
    }

    function drawBubble(b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.sin(b.x * 0.002 + b.y * 0.002) * 0.08);
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 24;
      ctx.globalAlpha = 0.96;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r, b.r * 0.7, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.font = 'bold 1.1rem Inter, sans-serif';
      ctx.fillStyle = b.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, 0, 0);
      ctx.restore();
    }

    function drawThreads() {
      ctx.save();
      ctx.strokeStyle = 'rgba(99,102,241,0.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i], b = bubbles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 320) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.bezierCurveTo(
              (a.x + b.x) / 2 + randomBetween(-30, 30),
              (a.y + b.y) / 2 + randomBetween(-30, 30),
              (a.x + b.x) / 2 + randomBetween(-30, 30),
              (a.y + b.y) / 2 + randomBetween(-30, 30),
              b.x, b.y
            );
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      drawMeshGradient();
      drawCentralOrb();
      drawThreads();
      // Physics
      for (const b of bubbles) {
        // Mouse repulsion
        const dx = b.x - mouse.current.x;
        const dy = b.y - mouse.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          const force = (160 - dist) * 0.12;
          b.vx += (dx / dist) * force;
          b.vy += (dy / dist) * force;
        }
        // Spring to origin
        b.vx += (b.ox - b.x) * 0.012;
        b.vy += (b.oy - b.y) * 0.012;
        // Damping
        b.vx *= 0.92;
        b.vy *= 0.92;
        b.x += b.vx;
        b.y += b.vy;
      }
      // Draw bubbles
      for (const b of bubbles) drawBubble(b);
      requestAnimationFrame(animate);
    }
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Mouse tracking
  useEffect(() => {
    function onMove(e) {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block', position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
        <h1 style={{ fontWeight: 800, fontSize: '2.8rem', color: '#0F172A', letterSpacing: '-1.5px', textShadow: '0 2px 24px #fff8' }}>
          The Living Ecosystem
        </h1>
        <p style={{ color: '#334155', fontSize: '1.2rem', marginTop: 12, fontWeight: 500 }}>
          Organic mesh gradients, 3D chat bubbles, and interactive physics.<br />
          Move your mouse to play with the ecosystem.
        </p>
        <button onClick={() => onNavigate('landing1')} style={{ marginTop: 28, background: 'linear-gradient(90deg,#6366F1,#EC4899)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 16px #6366F133', cursor: 'pointer' }}>
          Try another concept
        </button>
      </div>
    </div>
  );
}
