
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function BackgroundScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLError, setWebGLError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || webGLError) return;

    // Safety check for WebGL support
    if (!window.WebGLRenderingContext) {
        setWebGLError(true);
        return;
    }

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animationFrameId: number;
    
    // Resource tracking for disposal
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    try {
        // --- SETUP ---
        scene = new THREE.Scene();
        // Deep dark blue fog for depth
        scene.fog = new THREE.FogExp2(0x020617, 0.012); 

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 18;
        camera.position.y = 4;
        camera.rotation.x = -0.1;

        // Try creating renderer
        renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true,
            powerPreference: "default" 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const container = containerRef.current;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // --- LIGHTS ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.6); 
        scene.add(hemiLight);

        const blueLight = new THREE.PointLight(0x38bdf8, 2, 80);
        scene.add(blueLight);

        const purpleLight = new THREE.PointLight(0xa855f7, 2, 80);
        scene.add(purpleLight);

        // --- MOVING GRID FLOOR (Digital Horizon) ---
        const gridHelper = new THREE.GridHelper(400, 80, 0x1e293b, 0x0f172a);
        gridHelper.position.y = -10;
        scene.add(gridHelper);

        // --- STARS ---
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const posArray = new Float32Array(starCount * 3);
        for(let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 300;
            // Keep stars mostly above grid
            if (i % 3 === 1 && posArray[i] < -5) posArray[i] = -5;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMaterial = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const starMesh = new THREE.Points(starGeometry, starMaterial);
        scene.add(starMesh);
        
        geometries.push(starGeometry);
        materials.push(starMaterial);

        // --- MATERIALS (PBR / ETHEREAL) ---
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0xbae6fd,
            emissiveIntensity: 0.25, 
        });
        
        const cockpitMat = new THREE.MeshStandardMaterial({ 
            color: 0x020617, 
            roughness: 0.0, 
            metalness: 0.95 
        });

        const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const navRed = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        const navGreen = new THREE.MeshBasicMaterial({ color: 0x44ff44 });

        materials.push(bodyMat, cockpitMat, engineGlowMat, navRed, navGreen);

        // --- PLANE FACTORY ---
        const createPlane = (type: 'liner' | 'heavy' | 'executive') => {
            const group = new THREE.Group();

            // 1. Fuselage
            let length = 4.2;
            let radius = 0.35;
            if (type === 'heavy') { length = 5.5; radius = 0.45; }
            if (type === 'executive') { length = 3.0; radius = 0.25; }

            const fuselageGeo = new THREE.CylinderGeometry(radius, radius, length, 24);
            fuselageGeo.rotateX(Math.PI / 2); 
            const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
            group.add(fuselage);
            geometries.push(fuselageGeo);

            // Nose
            const noseGeo = new THREE.SphereGeometry(radius, 24, 24);
            noseGeo.scale(1, 1, 1.5);
            const nose = new THREE.Mesh(noseGeo, bodyMat);
            nose.position.z = length / 2;
            group.add(nose);
            geometries.push(noseGeo);

            // Cockpit
            const cockpitGeo = new THREE.BoxGeometry(radius * 0.8, radius * 0.5, radius * 1.2);
            const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
            cockpit.position.set(0, radius * 0.6, length / 2 - 0.2);
            cockpit.rotation.x = -0.2;
            group.add(cockpit);
            geometries.push(cockpitGeo);

            // Tail Cone
            const tailConeGeo = new THREE.CylinderGeometry(radius, radius * 0.1, 1.4, 24);
            tailConeGeo.rotateX(Math.PI / 2);
            const tailCone = new THREE.Mesh(tailConeGeo, bodyMat);
            tailCone.position.z = -(length / 2 + 0.7);
            group.add(tailCone);
            geometries.push(tailConeGeo);

            // 2. Wings (Swept)
            const wingShape = new THREE.Shape();
            const rootX = radius * 0.5;
            let span = 3.2;
            
            if (type === 'executive') {
                span = 2.5;
                wingShape.moveTo(rootX, -1.0); 
                wingShape.lineTo(span, 1.0);   
                wingShape.lineTo(span, 1.6);   
                wingShape.lineTo(rootX, 1.5);  
            } else if (type === 'heavy') {
                span = 4.5;
                wingShape.moveTo(rootX, -1.2); 
                wingShape.lineTo(span, 1.0);   
                wingShape.lineTo(span, 1.8);   
                wingShape.lineTo(rootX, 2.0);  
            } else {
                span = 3.2;
                wingShape.moveTo(rootX, -1.0); 
                wingShape.lineTo(span, 1.2);   
                wingShape.lineTo(span, 1.8);   
                wingShape.lineTo(rootX, 1.8);  
            }

            const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
            wingGeo.rotateX(-Math.PI / 2);
            geometries.push(wingGeo);
            
            const leftWing = new THREE.Mesh(wingGeo, bodyMat);
            leftWing.position.y = -0.1;
            group.add(leftWing);

            const rightWingContainer = new THREE.Group();
            rightWingContainer.scale.x = -1;
            rightWingContainer.add(leftWing.clone());
            group.add(rightWingContainer);

            // 3. Tail
            if (type === 'executive') {
                const vTailGeo = new THREE.BoxGeometry(0.1, 1.5, 1.0);
                const vTail = new THREE.Mesh(vTailGeo, bodyMat);
                vTail.position.set(0, 0.8, -(length / 2 + 0.5));
                vTail.rotation.x = 0.2;
                group.add(vTail);
                geometries.push(vTailGeo);

                const hTailGeo = new THREE.BoxGeometry(1.8, 0.1, 0.6);
                const hTail = new THREE.Mesh(hTailGeo, bodyMat);
                hTail.position.set(0, 1.5, -(length / 2 + 0.8));
                group.add(hTail);
                geometries.push(hTailGeo);
            } else {
                const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 1.5), bodyMat);
                vFin.position.set(0, 0.8, -(length / 2 + 0.5));
                vFin.rotation.x = 0.2;
                group.add(vFin);
                geometries.push(vFin.geometry);

                const hFin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.0), bodyMat);
                hFin.position.set(0, 0.2, -(length / 2 + 0.8));
                group.add(hFin);
                geometries.push(hFin.geometry);
            }

            // 4. Engines
            const engineGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.5, 0.8, 16);
            engineGeo.rotateX(Math.PI / 2);
            geometries.push(engineGeo);
            const fanGeo = new THREE.CircleGeometry(radius * 0.45, 16);
            geometries.push(fanGeo);

            const addEngine = (x: number, y: number, z: number) => {
                const eng = new THREE.Mesh(engineGeo, bodyMat);
                eng.position.set(x, y, z);
                const fan = new THREE.Mesh(fanGeo, engineGlowMat);
                fan.position.set(0, 0.41, 0); 
                fan.rotateX(-Math.PI / 2);
                eng.add(fan);
                group.add(eng);
            };

            if (type === 'executive') {
                addEngine(radius + 0.2, 0.2, -(length / 2 - 0.5));
                addEngine(-(radius + 0.2), 0.2, -(length / 2 - 0.5));
            } else if (type === 'heavy') {
                addEngine(1.2, -0.4, 0.5);
                addEngine(-1.2, -0.4, 0.5);
                addEngine(2.5, -0.3, -0.5);
                addEngine(-2.5, -0.3, -0.5);
            } else {
                addEngine(1.5, -0.4, 0);
                addEngine(-1.5, -0.4, 0);
            }

            // 5. Lights
            const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
            geometries.push(lightGeo);
            const lRed = new THREE.Mesh(lightGeo, navRed);
            const lGreen = new THREE.Mesh(lightGeo, navGreen);
            let tipZ = type === 'executive' ? -1.3 : (type === 'heavy' ? -1.4 : -1.5);
            lRed.position.set(-span, 0, tipZ);
            lGreen.position.set(span, 0, tipZ);
            group.add(lRed);
            group.add(lGreen);

            group.scale.set(0.6, 0.6, 0.6);
            return group;
        };

        const planesGroup = new THREE.Group();
        scene.add(planesGroup);

        const fleetConfig = [
            { type: 'liner', offset: 0, speed: 0.3, radiusX: 20, radiusZ: 12, yAmp: 3 },
            { type: 'heavy', offset: 2.5, speed: 0.2, radiusX: 24, radiusZ: 15, yAmp: 2 },
            { type: 'executive', offset: 4.0, speed: 0.5, radiusX: 18, radiusZ: 10, yAmp: 4 },
            { type: 'liner', offset: 1.2, speed: 0.35, radiusX: 25, radiusZ: 14, yAmp: 5 },
            { type: 'heavy', offset: 5.5, speed: 0.25, radiusX: 30, radiusZ: 18, yAmp: 2 },
        ];

        const planes = fleetConfig.map(config => {
            const mesh = createPlane(config.type as any);
            mesh.userData = config;
            planesGroup.add(mesh);
            return mesh;
        });

        // --- ANIMATION ---
        const clock = new THREE.Clock();

        const animate = () => {
            const time = clock.getElapsedTime();

            // Animate Grid - Infinite Scroll
            gridHelper.position.z = (time * 5) % 5; 

            // Rotate Stars
            starMesh.rotation.y = time * 0.01;

            // Move Lights
            blueLight.position.x = Math.sin(time * 0.5) * 15;
            blueLight.position.z = Math.cos(time * 0.5) * 15;
            blueLight.position.y = 5 + Math.sin(time) * 3;
            blueLight.intensity = 2 + Math.sin(time * 2) * 0.5;

            purpleLight.position.x = Math.sin(time * 0.3 + Math.PI) * 20;
            purpleLight.position.z = Math.cos(time * 0.3 + Math.PI) * 10;
            purpleLight.position.y = -5 + Math.cos(time * 0.5) * 4;
            purpleLight.intensity = 1.5 + Math.cos(time * 1.5) * 0.5;

            // Move Planes
            planes.forEach((plane) => {
                 const { offset, speed, radiusX, radiusZ, yAmp } = plane.userData;
                 const t = time * speed + offset;
                 const x = Math.sin(t) * radiusX;
                 const z = Math.cos(t) * radiusZ - 10;
                 const y = Math.sin(t * 1.5) * yAmp;

                 const delta = 0.1;
                 const tx = Math.sin(t + delta) * radiusX;
                 const tz = Math.cos(t + delta) * radiusZ - 10;
                 const ty = Math.sin((t + delta) * 1.5) * yAmp;
                 
                 plane.position.set(x, y, z);
                 plane.lookAt(tx, ty, tz);
                 
                 const turnSharpness = (tx - x);
                 plane.rotation.z -= turnSharpness * 0.25;
            });

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate); 
        };

        animate(); 

    } catch (e) {
        console.error("WebGL Initialization Failed:", e);
        setWebGLError(true);
        return;
    }

    const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        // --- CLEANUP RESOURCES ---
        if (renderer) {
            // Force context loss to release browser handle
            renderer.forceContextLoss();
            renderer.dispose();
            
            if (renderer.domElement && containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
        }
        
        // Dispose Geometries & Materials
        geometries.forEach(g => g.dispose());
        materials.forEach(m => m.dispose());
    };
  }, [webGLError]); // Add webGLError to dep array to prevent re-run if already failed

  if (webGLError) {
    // Fallback static background if WebGL fails
    return (
        <div 
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ 
                background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 40%, #020617 100%)',
            }}
        />
    );
  }

  return (
    <div 
        ref={containerRef} 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ 
            background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 40%, #020617 100%)',
        }}
    />
  );
}
