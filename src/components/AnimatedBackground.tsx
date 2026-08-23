'use client';

import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 4 Singularidades Gravitacionales con tonos Antique Brass y Coffee
    const gravitationalLenses = [
      {
        x: width * 0.22,
        y: height * 0.32,
        vx: 0.182,
        vy: 0.126,
        einsteinRadius: 160,
        haloRadius: 680,
        coreColor: '207, 157, 123', // Antique Brass
        haloColor: '114, 75, 57',   // Coffee
      },
      {
        x: width * 0.78,
        y: height * 0.65,
        vx: -0.146,
        vy: -0.162,
        einsteinRadius: 190,
        haloRadius: 760,
        coreColor: '255, 255, 255',
        haloColor: '22, 33, 39',    // Dark Jungle Green
      },
      {
        x: width * 0.55,
        y: height * 0.18,
        vx: 0.134,
        vy: -0.118,
        einsteinRadius: 140,
        haloRadius: 600,
        coreColor: '207, 157, 123',
        haloColor: '58, 53, 52',    // Jet
      },
      {
        x: width * 0.35,
        y: height * 0.82,
        vx: -0.154,
        vy: 0.106,
        einsteinRadius: 150,
        haloRadius: 640,
        coreColor: '243, 244, 246',
        haloColor: '114, 75, 57',
      },
    ];

    // Microcadenas Moleculares Flotantes
    const moleculesCount = 18;
    const molecules = Array.from({ length: moleculesCount }, () => {
      const nodeCount = Math.floor(Math.random() * 3) + 3;
      const bondLength = Math.random() * 12 + 14;
      const nodes = [{ x: 0, y: 0, r: Math.random() * 1.2 + 1.8 }];

      for (let i = 1; i < nodeCount; i++) {
        const angle = (i * Math.PI * 2) / nodeCount + (Math.random() - 0.5) * 0.5;
        nodes.push({
          x: Math.cos(angle) * bondLength,
          y: Math.sin(angle) * bondLength,
          r: Math.random() * 1.0 + 1.4,
        });
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.62,
        vy: (Math.random() - 0.5) * 0.62,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.016,
        opacity: Math.random() * 0.35 + 0.15,
        nodes,
      };
    });

    let t = 0;

    const render = () => {
      t += 0.018;
      ctx.fillStyle = '#0C1519'; // Chinese Black Base
      ctx.fillRect(0, 0, width, height);

      gravitationalLenses.forEach((lens) => {
        lens.x += lens.vx;
        lens.y += lens.vy;
        if (lens.x < 30 || lens.x > width - 30) lens.vx *= -1;
        if (lens.y < 30 || lens.y > height - 30) lens.vy *= -1;
      });

      // A. BRUMAS DE LUZ Y HALOS GALÁCTICOS
      gravitationalLenses.forEach((lens) => {
        const pulse = Math.sin(t * 2.2) * 45;
        const currentHalo = lens.haloRadius + pulse;

        const haloGrad = ctx.createRadialGradient(
          lens.x,
          lens.y,
          0,
          lens.x,
          lens.y,
          currentHalo
        );
        haloGrad.addColorStop(0, `rgba(${lens.coreColor}, 0.58)`);
        haloGrad.addColorStop(0.2, `rgba(${lens.haloColor}, 0.34)`);
        haloGrad.addColorStop(0.6, `rgba(${lens.haloColor}, 0.08)`);
        haloGrad.addColorStop(1, 'rgba(12, 21, 25, 0)');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(lens.x, lens.y, currentHalo, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(lens.x, lens.y, 7.5 + Math.sin(t * 3) * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#CF9D7B';
        ctx.shadowBlur = 35;
        ctx.fill();
        ctx.restore();
      });

      // B. MALLA ESPACIO-TEMPORAL CON DEFLEXIÓN ÓPTICA
      ctx.strokeStyle = 'rgba(114, 75, 57, 0.28)';
      ctx.lineWidth = 1.1;
      const gridSize = 45;
      const sampleStep = 8;

      const applyLensing = (gx: number, gy: number) => {
        let finalX = gx;
        let finalY = gy;

        gravitationalLenses.forEach((lens) => {
          const dx = finalX - lens.x;
          const dy = finalY - lens.y;
          const r = Math.hypot(dx, dy);

          if (r > 2 && r < lens.haloRadius) {
            const re2 = lens.einsteinRadius ** 2;
            const deflection = (re2 / (r + re2 * 0.006)) * (1 - r / lens.haloRadius);
            finalX += (dx / r) * deflection * 0.82;
            finalY += (dy / r) * deflection * 0.82;
          }
        });

        return { x: finalX, y: finalY };
      };

      for (let gx = 0; gx < width; gx += gridSize) {
        ctx.beginPath();
        for (let gy = 0; gy <= height; gy += sampleStep) {
          const pt = applyLensing(gx, gy);
          if (gy === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      for (let gy = 0; gy < height; gy += gridSize) {
        ctx.beginPath();
        for (let gx = 0; gx <= width; gx += sampleStep) {
          const pt = applyLensing(gx, gy);
          if (gx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // C. CADENAS MOLECULARES FLOTANTES
      molecules.forEach((mol) => {
        mol.x += mol.vx;
        mol.y += mol.vy;
        mol.rotation += mol.rotSpeed;

        if (mol.x < -30) mol.x = width + 30;
        if (mol.x > width + 30) mol.x = -30;
        if (mol.y < -30) mol.y = height + 30;
        if (mol.y > height + 30) mol.y = -30;

        ctx.save();
        ctx.translate(mol.x, mol.y);
        ctx.rotate(mol.rotation);

        ctx.strokeStyle = `rgba(114, 75, 57, ${mol.opacity * 0.85})`;
        ctx.lineWidth = 1;
        for (let i = 1; i < mol.nodes.length; i++) {
          ctx.beginPath();
          ctx.moveTo(mol.nodes[0].x, mol.nodes[0].y);
          ctx.lineTo(mol.nodes[i].x, mol.nodes[i].y);
          ctx.stroke();

          if (i > 1) {
            ctx.beginPath();
            ctx.moveTo(mol.nodes[i - 1].x, mol.nodes[i - 1].y);
            ctx.lineTo(mol.nodes[i].x, mol.nodes[i].y);
            ctx.stroke();
          }
        }

        mol.nodes.forEach((node) => {
          ctx.fillStyle = `rgba(207, 157, 123, ${mol.opacity})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
    />
  );
}