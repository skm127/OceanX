/**
 * CurrentVectors — Enhanced ocean current visualization with flowing streamlines.
 * Inspired by Google Earth's current visualization with swirling, flowing patterns.
 * Uses animated particles that follow current vectors to create continuous streamlines.
 */
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { latLonToVector3, GLOBE_RADIUS } from '../../utils/coordinates';
import { interpolateColor, CURRENT_COLORMAP } from '../../utils/colormap';

export interface CurrentVector {
  lat: number;
  lon: number;
  uo: number;
  vo: number;
  speed: number;
}

interface CurrentVectorsProps {
  vectors: CurrentVector[];
  speedMin: number;
  speedMax: number;
  visible?: boolean;
}

// Enhanced streaming particle system for swirling currents
function StreamingCurrents({ vectors, speedMin, speedMax }: { vectors: CurrentVector[]; speedMin: number; speedMax: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  
  // Create flowing particles that follow current patterns
  const { positions, colors, speeds, latLonData } = useMemo(() => {
    const particleCount = Math.min(vectors.length * 8, 5000); // Multiple particles per vector
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const latLonData: { lat: number; lon: number; uo: number; vo: number }[] = [];
    
    const speedRange = speedMax - speedMin || 1;
    
    for (let i = 0; i < particleCount; i++) {
      const vecIndex = i % vectors.length;
      const vec = vectors[vecIndex];
      
      // Initial position on globe (elevated above ocean data layer)
      const pos = latLonToVector3(vec.lat, vec.lon, GLOBE_RADIUS + 0.022);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      
      // Color by speed - blue to cyan to white
      const t = (vec.speed - speedMin) / speedRange;
      const [r, g, b] = interpolateColor(CURRENT_COLORMAP, t);
      colors[i * 3] = r / 255;
      colors[i * 3 + 1] = g / 255;
      colors[i * 3 + 2] = b / 255;
      
      speeds[i] = vec.speed;
      latLonData.push({ lat: vec.lat, lon: vec.lon, uo: vec.uo, vo: vec.vo });
    }
    
    return { positions, colors, speeds, latLonData };
  }, [vectors, speedMin, speedMax]);
  
  // Animate particles along current streamlines
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry;
      const posArray = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < latLonData.length; i++) {
        const data = latLonData[i];
        const speed = speeds[i];
        
        // Move particle along current direction
        const moveSpeed = 0.02 * (speed / (speedMax || 0.1)) * delta * 60;
        
        // Update lat/lon based on current vectors
        let newLat = data.lat + data.vo * moveSpeed * 0.1;
        let newLon = data.lon + data.uo * moveSpeed * 0.1;
        
        // Wrap around
        if (newLon > 180) newLon -= 360;
        if (newLon < -180) newLon += 360;
        if (newLat > 90) newLat = 90;
        if (newLat < -90) newLat = -90;
        
        // Update 3D position
        const newPos = latLonToVector3(newLat, newLon, GLOBE_RADIUS + 0.022);
        posArray[i * 3] = newPos.x;
        posArray[i * 3 + 1] = newPos.y;
        posArray[i * 3 + 2] = newPos.z;
        
        // Update stored data
        latLonData[i] = { ...data, lat: newLat, lon: newLon };
      }
      
      geometry.attributes.position.needsUpdate = true;
    }
  });
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);
  
  return (
    <points ref={particlesRef} geometry={geometry} renderOrder={15}>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.88}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Fallback to original arrow system for lower density areas
function CurrentArrows({ vectors, speedMin, speedMax }: { vectors: CurrentVector[]; speedMin: number; speedMax: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.012, 0.06, 6);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  useEffect(() => {
    if (!meshRef.current || vectors.length === 0) return;

    const mesh = meshRef.current;
    const colorArray = new Float32Array(vectors.length * 3);
    const speedRange = speedMax - speedMin || 1;

    vectors.forEach((vec, i) => {
      const pos = latLonToVector3(vec.lat, vec.lon, GLOBE_RADIUS + 0.020);
      dummy.position.copy(pos);

      const posE = latLonToVector3(vec.lat, vec.lon + 0.5, GLOBE_RADIUS + 0.020);
      const posN = latLonToVector3(vec.lat + 0.5, vec.lon, GLOBE_RADIUS + 0.020);
      
      const east = posE.clone().sub(pos).normalize();
      const north = posN.clone().sub(pos).normalize();
      
      const direction = east.multiplyScalar(vec.uo).add(north.multiplyScalar(vec.vo)).normalize();
      
      const scale = 0.8 + (vec.speed / (speedMax || 0.1)) * 2.0;
      dummy.scale.set(scale, scale, scale);

      if (direction.length() > 0.001) {
        dummy.lookAt(pos.clone().add(direction));
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const t = (vec.speed - speedMin) / speedRange;
      const [r, g, b] = interpolateColor(CURRENT_COLORMAP, t);
      colorArray[i * 3] = r / 255;
      colorArray[i * 3 + 1] = g / 255;
      colorArray[i * 3 + 2] = b / 255;
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorArray, 3)
    );
  }, [vectors, speedMin, speedMax, dummy]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.75 + 0.25 * Math.sin(timeRef.current * 2);
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, vectors.length]}
      renderOrder={14}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function CurrentVectors({ vectors, speedMin, speedMax, visible = true }: CurrentVectorsProps) {
  if (!visible || vectors.length === 0) return null;

  return (
    <group>
      <StreamingCurrents vectors={vectors} speedMin={speedMin} speedMax={speedMax} />
      <CurrentArrows vectors={vectors} speedMin={speedMin} speedMax={speedMax} />
    </group>
  );
}
