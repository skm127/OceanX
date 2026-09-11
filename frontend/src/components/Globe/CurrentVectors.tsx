/**
 * CurrentVectors — Enhanced ocean current visualization with flowing trail ribbons.
 * Uses animated particles that follow current vectors with fading trail tails,
 * creating continuous flowing ribbon streamlines across the globe surface.
 *
 * Key improvements over basic particle system:
 * - 4-segment trail tails per particle that fade in opacity
 * - Size attenuation by speed (faster currents = larger, brighter particles)
 * - Domain-bounded respawn logic for continuous looping flow
 * - Speed-mapped color gradient from deep blue (calm) to white-hot (intense)
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

/** Number of historical trail positions per particle */
const TRAIL_LENGTH = 4;

/** Domain boundaries for respawn detection */
const DOMAIN = { latMin: -2, latMax: 30, lonMin: 58, lonMax: 102 };

/**
 * StreamingCurrents — Core particle trail system.
 * Each particle maintains a short history buffer for its trail tail.
 * The trail fades in opacity from head to tail, creating flowing ribbons.
 */
function StreamingCurrents({
  vectors,
  speedMin,
  speedMax,
}: {
  vectors: CurrentVector[];
  speedMin: number;
  speedMax: number;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.LineSegments>(null);

  // Particle count: enough density for visible flow patterns
  const particleCount = useMemo(
    () => Math.min(vectors.length * 6, 4000),
    [vectors.length]
  );

  // Per-particle state stored as refs for mutation in useFrame
  const stateRef = useRef<{
    latLon: { lat: number; lon: number; uo: number; vo: number; speed: number; originIdx: number }[];
    trails: Float32Array; // (particleCount * TRAIL_LENGTH * 3) — trail history positions
    initialized: boolean;
  }>({
    latLon: [],
    trails: new Float32Array(0),
    initialized: false,
  });

  // Initialize particle positions and colors
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speedRange = speedMax - speedMin || 1;

    const latLonData: typeof stateRef.current.latLon = [];

    for (let i = 0; i < particleCount; i++) {
      const vecIndex = i % vectors.length;
      const vec = vectors[vecIndex];

      // Scatter initial position slightly around the origin vector
      const jitterLat = (Math.random() - 0.5) * 1.5;
      const jitterLon = (Math.random() - 0.5) * 1.5;
      const lat = vec.lat + jitterLat;
      const lon = vec.lon + jitterLon;

      const pos = latLonToVector3(lat, lon, GLOBE_RADIUS + 0.022);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Speed-mapped color: deep blue → cyan → yellow → white
      const t = Math.min(1, (vec.speed - speedMin) / speedRange);
      const [r, g, b] = interpolateColor(CURRENT_COLORMAP, t);
      colors[i * 3] = r / 255;
      colors[i * 3 + 1] = g / 255;
      colors[i * 3 + 2] = b / 255;

      // Size attenuation by speed — faster = larger
      sizes[i] = 0.025 + t * 0.045;

      latLonData.push({ lat, lon, uo: vec.uo, vo: vec.vo, speed: vec.speed, originIdx: vecIndex });
    }

    stateRef.current.latLon = latLonData;
    stateRef.current.trails = new Float32Array(particleCount * TRAIL_LENGTH * 3);
    stateRef.current.initialized = false;

    return { positions, colors, sizes };
  }, [vectors, speedMin, speedMax, particleCount]);

  // Trail line geometry (pairs of points for LineSegments)
  const trailPositions = useMemo(() => {
    // Each particle has (TRAIL_LENGTH - 1) line segments → 2 points each
    const segCount = particleCount * (TRAIL_LENGTH - 1);
    return new Float32Array(segCount * 2 * 3);
  }, [particleCount]);

  const trailColors = useMemo(() => {
    const segCount = particleCount * (TRAIL_LENGTH - 1);
    const cols = new Float32Array(segCount * 2 * 3);
    const speedRange = speedMax - speedMin || 1;

    for (let i = 0; i < particleCount; i++) {
      const vecIndex = i % vectors.length;
      const vec = vectors[vecIndex];
      const t = Math.min(1, (vec.speed - speedMin) / speedRange);
      const [r, g, b] = interpolateColor(CURRENT_COLORMAP, t);

      for (let s = 0; s < TRAIL_LENGTH - 1; s++) {
        const segIdx = (i * (TRAIL_LENGTH - 1) + s) * 6;
        // Fade opacity along trail by darkening color toward tail
        const fadeFactor = 1.0 - (s / (TRAIL_LENGTH - 1)) * 0.7;
        cols[segIdx] = (r / 255) * fadeFactor;
        cols[segIdx + 1] = (g / 255) * fadeFactor;
        cols[segIdx + 2] = (b / 255) * fadeFactor;
        const tailFade = fadeFactor * 0.6;
        cols[segIdx + 3] = (r / 255) * tailFade;
        cols[segIdx + 4] = (g / 255) * tailFade;
        cols[segIdx + 5] = (b / 255) * tailFade;
      }
    }
    return cols;
  }, [vectors, speedMin, speedMax, particleCount]);

  // Animate particles and update trail history
  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const state = stateRef.current;
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < state.latLon.length; i++) {
      const data = state.latLon[i];

      // Shift trail history (newest at index 0)
      for (let t = TRAIL_LENGTH - 1; t > 0; t--) {
        const dstIdx = (i * TRAIL_LENGTH + t) * 3;
        const srcIdx = (i * TRAIL_LENGTH + t - 1) * 3;
        state.trails[dstIdx] = state.trails[srcIdx];
        state.trails[dstIdx + 1] = state.trails[srcIdx + 1];
        state.trails[dstIdx + 2] = state.trails[srcIdx + 2];
      }

      // Store current position as newest trail point
      const headIdx = i * TRAIL_LENGTH * 3;
      state.trails[headIdx] = posArray[i * 3];
      state.trails[headIdx + 1] = posArray[i * 3 + 1];
      state.trails[headIdx + 2] = posArray[i * 3 + 2];

      // Advect particle along current vectors
      const moveSpeed = 0.025 * (data.speed / (speedMax || 0.1)) * delta * 60;
      let newLat = data.lat + data.vo * moveSpeed * 0.12;
      let newLon = data.lon + data.uo * moveSpeed * 0.12;

      // Respawn check: if particle drifts outside domain, reset to origin
      if (
        newLat < DOMAIN.latMin ||
        newLat > DOMAIN.latMax ||
        newLon < DOMAIN.lonMin ||
        newLon > DOMAIN.lonMax
      ) {
        const origin = vectors[data.originIdx];
        newLat = origin.lat + (Math.random() - 0.5) * 1.0;
        newLon = origin.lon + (Math.random() - 0.5) * 1.0;
        // Reset trail positions to avoid visual pop
        const newPos = latLonToVector3(newLat, newLon, GLOBE_RADIUS + 0.022);
        for (let t = 0; t < TRAIL_LENGTH; t++) {
          const idx = (i * TRAIL_LENGTH + t) * 3;
          state.trails[idx] = newPos.x;
          state.trails[idx + 1] = newPos.y;
          state.trails[idx + 2] = newPos.z;
        }
      }

      // Wrap longitude
      if (newLon > 180) newLon -= 360;
      if (newLon < -180) newLon += 360;
      newLat = Math.max(-90, Math.min(90, newLat));

      const newPos = latLonToVector3(newLat, newLon, GLOBE_RADIUS + 0.022);
      posArray[i * 3] = newPos.x;
      posArray[i * 3 + 1] = newPos.y;
      posArray[i * 3 + 2] = newPos.z;

      state.latLon[i] = { ...data, lat: newLat, lon: newLon };
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Update trail line segments
    if (trailRef.current) {
      const trailPosArray = trailRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < state.latLon.length; i++) {
        for (let s = 0; s < TRAIL_LENGTH - 1; s++) {
          const segIdx = (i * (TRAIL_LENGTH - 1) + s) * 6;
          const headIdx = (i * TRAIL_LENGTH + s) * 3;
          const tailIdx = (i * TRAIL_LENGTH + s + 1) * 3;

          trailPosArray[segIdx] = state.trails[headIdx];
          trailPosArray[segIdx + 1] = state.trails[headIdx + 1];
          trailPosArray[segIdx + 2] = state.trails[headIdx + 2];
          trailPosArray[segIdx + 3] = state.trails[tailIdx];
          trailPosArray[segIdx + 4] = state.trails[tailIdx + 1];
          trailPosArray[segIdx + 5] = state.trails[tailIdx + 2];
        }
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Initialize trail positions on first frame
    if (!state.initialized) {
      for (let i = 0; i < state.latLon.length; i++) {
        for (let t = 0; t < TRAIL_LENGTH; t++) {
          const idx = (i * TRAIL_LENGTH + t) * 3;
          state.trails[idx] = posArray[i * 3];
          state.trails[idx + 1] = posArray[i * 3 + 1];
          state.trails[idx + 2] = posArray[i * 3 + 2];
        }
      }
      state.initialized = true;
    }
  });

  const pointsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, colors, sizes]);

  const trailGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    return geo;
  }, [trailPositions, trailColors]);

  return (
    <group>
      {/* Trail ribbons */}
      <lineSegments ref={trailRef} geometry={trailGeo} renderOrder={14}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Particle heads */}
      <points ref={particlesRef} geometry={pointsGeo} renderOrder={15}>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Directional arrow cones showing current direction.
 * Rendered as instanced meshes for performance.
 */
function CurrentArrows({
  vectors,
  speedMin,
  speedMax,
}: {
  vectors: CurrentVector[];
  speedMin: number;
  speedMax: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.01, 0.05, 6);
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

      const t = vec.speed / (speedMax || 0.1);
      const scale = 0.6 + t * 1.8;
      dummy.scale.set(scale, scale, scale);

      if (direction.length() > 0.001) {
        dummy.lookAt(pos.clone().add(direction));
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const ct = (vec.speed - speedMin) / speedRange;
      const [r, g, b] = interpolateColor(CURRENT_COLORMAP, ct);
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
      material.opacity = 0.7 + 0.3 * Math.sin(timeRef.current * 2);
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, vectors.length]}
      renderOrder={13}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function CurrentVectors({
  vectors,
  speedMin,
  speedMax,
  visible = true,
}: CurrentVectorsProps) {
  if (!visible || vectors.length === 0) return null;

  return (
    <group>
      <StreamingCurrents vectors={vectors} speedMin={speedMin} speedMax={speedMax} />
      <CurrentArrows vectors={vectors} speedMin={speedMin} speedMax={speedMax} />
    </group>
  );
}
