
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { FlightDeal } from '../../types';
import { AIRPORT_DB } from '../../data/airports';
import { Globe, RotateCw, Plus, Minus } from 'lucide-react';

interface GlobeRouteMapProps {
  deals: FlightDeal[];
  selectedDealId: string | null;
  onSelectDeal: (id: string) => void;
}

export default function GlobeRouteMap({ deals, selectedDealId, onSelectDeal }: GlobeRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 }); // Target for smooth interpolation
  
  // Convert Lat/Lon to 3D Vector
  const latLonToVector3 = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    // Transparent background to blend with app
    scene.background = null; 

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 22; // Start zoomed out slightly
    camera.position.y = 8;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // --- GLOBE OBJECTS ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Base Sphere (The Ocean/Darkness)
    const sphereGeo = new THREE.SphereGeometry(10, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a, // Slate 900
      emissive: 0x1e293b,
      emissiveIntensity: 0.1,
      shininess: 20,
      transparent: true,
      opacity: 0.95,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // 2. Grid/Wireframe Overlay
    const wireframeGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(10.05, 24, 24));
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.05 });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    globeGroup.add(wireframe);

    // 3. Atmosphere Glow (Backside)
    const haloGeo = new THREE.SphereGeometry(10.2, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(halo);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(20, 10, 20);
    scene.add(dirLight);

    // --- DATA VISUALIZATION ---
    
    // Plot All Known Airports (Faint dots)
    const airportDotGeo = new THREE.BufferGeometry();
    const airportPositions: number[] = [];
    Object.values(AIRPORT_DB).forEach(apt => {
        const v = latLonToVector3(apt.lat, apt.lon, 10.0);
        airportPositions.push(v.x, v.y, v.z);
    });
    airportDotGeo.setAttribute('position', new THREE.Float32BufferAttribute(airportPositions, 3));
    const airportMat = new THREE.PointsMaterial({ color: 0x64748b, size: 0.08, transparent: true, opacity: 0.4 });
    const airportsMesh = new THREE.Points(airportDotGeo, airportMat);
    globeGroup.add(airportsMesh);

    // Plot Flight Arcs
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);

    // Process Deals into Curves
    deals.forEach((deal, idx) => {
        const isSelected = deal.id === selectedDealId;
        const color = isSelected ? 0x22d3ee : (selectedDealId ? 0x334155 : 0x38bdf8);
        const opacity = isSelected ? 1 : (selectedDealId ? 0.1 : 0.4);
        const lineWidth = isSelected ? 3 : 1;
        
        // Build segments
        deal.segments.forEach(seg => {
            const dep = AIRPORT_DB[seg.departure.iataCode];
            const arr = AIRPORT_DB[seg.arrival.iataCode];

            if (dep && arr) {
                const v1 = latLonToVector3(dep.lat, dep.lon, 10);
                const v2 = latLonToVector3(arr.lat, arr.lon, 10);
                
                // Calculate mid-point height based on distance
                const distance = v1.distanceTo(v2);
                const midHeight = 10 + distance * 0.5; // Arch height
                
                const mid = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(midHeight);

                // Create Curve
                const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
                const points = curve.getPoints(50);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ 
                    color: color, 
                    transparent: true, 
                    opacity: opacity,
                    linewidth: lineWidth // Note: linewidth only works in some browsers/WebGL implementations
                });
                const curveMesh = new THREE.Line(geometry, material);
                
                // Add animated "packet" if selected
                if (isSelected) {
                    const packetGeo = new THREE.SphereGeometry(0.15, 8, 8);
                    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const packet = new THREE.Mesh(packetGeo, packetMat);
                    // Animation logic handled in render loop
                    packet.userData = { curve, t: 0, speed: 0.005 };
                    arcsGroup.add(packet);
                }

                arcsGroup.add(curveMesh);

                // Add Terminal Points (Source/Dest highlight)
                [v1, v2].forEach(v => {
                    const dot = new THREE.Mesh(
                        new THREE.SphereGeometry(isSelected ? 0.2 : 0.1, 8, 8),
                        new THREE.MeshBasicMaterial({ color: isSelected ? 0xffffff : color })
                    );
                    dot.position.copy(v);
                    arcsGroup.add(dot);
                });
            }
        });
    });

    // --- CONTROLS LOGIC ---
    let frameId: number;
    const animate = () => {
        frameId = requestAnimationFrame(animate);

        // Smooth rotation interpolation
        if (!isDragging) {
            globeGroup.rotation.y += 0.001; // Auto-spin slowly
        } else {
            // Apply drag momentum could go here, but simple drag is handled by events below
        }

        // Lerp rotation to target (smooth drag)
        globeGroup.rotation.y += (targetRotation.current.y - globeGroup.rotation.y) * 0.1;
        globeGroup.rotation.x += (targetRotation.current.x - globeGroup.rotation.x) * 0.1;

        // Animate Packets
        arcsGroup.children.forEach(child => {
            if (child.userData.curve) {
                child.userData.t += child.userData.speed;
                if (child.userData.t > 1) child.userData.t = 0;
                const pos = child.userData.curve.getPointAt(child.userData.t);
                child.position.copy(pos);
            }
        });

        renderer.render(scene, camera);
    };

    animate();

    // Event Handlers for Drag
    const handleMouseDown = (e: MouseEvent) => {
        setIsDragging(true);
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
        targetRotation.current = { x: globeGroup.rotation.x, y: globeGroup.rotation.y };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.clientX - previousMousePosition.current.x,
            y: e.clientY - previousMousePosition.current.y
        };

        const rotateSpeed = 0.005;
        targetRotation.current.y += deltaMove.x * rotateSpeed;
        targetRotation.current.x += deltaMove.y * rotateSpeed;
        
        // Clamp vertical rotation
        targetRotation.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotation.current.x));

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
        // Clamp zoom
        camera.position.z = Math.max(12, Math.min(35, camera.position.z));
    };

    // Attach listeners
    const el = containerRef.current;
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Resize
    const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('resize', handleResize);
        el.removeEventListener('mousedown', handleMouseDown);
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('wheel', handleWheel);
        cancelAnimationFrame(frameId);
        if (renderer) renderer.dispose();
    };
  }, [deals, selectedDealId]); // Re-render scene if deals change

  return (
    <div className="relative w-full h-[500px] bg-slate-950/80 backdrop-blur-xl rounded-xl border border-brand-500/30 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
        <div ref={containerRef} className="w-full h-full cursor-move" />
        
        {/* Overlay UI */}
        <div className="absolute top-4 left-4 pointer-events-none">
             <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50 backdrop-blur-sm flex items-center gap-2">
                 <div className="bg-brand-500/20 p-1.5 rounded text-brand-400">
                    <Globe className="w-4 h-4" />
                 </div>
                 <div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Visualization</div>
                     <div className="text-xs font-black text-white">INTERACTIVE GLOBE</div>
                 </div>
             </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="text-center text-[10px] text-slate-500 font-mono">
                DRAG TO SPIN • SCROLL TO ZOOM
            </div>
        </div>
    </div>
  );
}
