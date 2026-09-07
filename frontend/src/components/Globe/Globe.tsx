/**
 * 3D Globe component using @react-three/fiber.
 * Inspired by OSIRIS (osirisai.live) / Palantir command & control aesthetic.
 * Renders NASA Blue Marble Earth, feather-blended ocean intelligence layers,
 * tactical corner reconnaissance brackets, and active in-situ telemetry beacons.
 */
import React, { useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToVector3, getBayOfBengalCameraPosition, GLOBE_RADIUS } from '../../utils/coordinates';
import OceanDataLayer from './OceanDataLayer';
import CurrentVectors, { type CurrentVector } from './CurrentVectors';
import ArgoMarkers from './ArgoMarkers';
import SubsurfaceVolumeBlock from './SubsurfaceVolumeBlock';
import type { OceanSliceData } from '../../hooks/useOceanData';
import type { ArgoProfileSummary } from '../../types';

interface GlobeProps {
  sliceData?: OceanSliceData | null;
  currentVectors?: CurrentVector[];
  currentSpeedMin?: number;
  currentSpeedMax?: number;
  showCurrents?: boolean;
  argoProfiles?: ArgoProfileSummary[];
  selectedArgoId?: string | null;
  targetCameraPos?: THREE.Vector3 | null;
  probedCoordinate?: { lat: number; lon: number } | null;
  oceanOpacity?: number;
  depthLevels?: number[];
  cameraPitch?: number;
  onSelectArgo?: (id: string) => void;
  onProbeCoordinate?: (coord: { lat: number; lon: number }) => void;
  onContextMenuCoordinate?: (coord: { lat: number; lon: number }) => void;
  onHoverCoordinate?: (coord: { lat: number; lon: number } | null) => void;
}


/** Earth fallback while satellite textures load */
function EarthFallback() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
      <meshStandardMaterial color="#061224" roughness={0.8} />
    </mesh>
  );
}

/** Earth core mesh with enhanced Google Earth-inspired rendering */
function EarthMesh() {
  const [colorMap, specularMap, normalMap] = useTexture([
    '/textures/earth_atmos_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_normal_2048.jpg',
  ]);

  colorMap.colorSpace = THREE.SRGBColorSpace;

  return (
    <group>
      {/* Core globe with enhanced satellite imagery */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={colorMap}
          roughnessMap={specularMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.2, 1.2)}
          roughness={0.55}
          metalness={0.15}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Enhanced atmospheric glow with multiple layers */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.025, 64, 64]} />
        <meshBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer atmospheric rim */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.035, 48, 48]} />
        <meshBasicMaterial
          color="#0288d1"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle cloud layer */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.008, 64, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.8}
          metalness={0.0}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}

function Earth() {
  return (
    <Suspense fallback={<EarthFallback />}>
      <EarthMesh />
    </Suspense>
  );
}

/** Subtle lat/lon coordinate grid lines */
function GridLines() {
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#0284c7',
        opacity: 0.12,
        transparent: true,
      }),
    []
  );

  const lines = useMemo(() => {
    const group: React.ReactNode[] = [];
    for (let lat = -80; lat <= 80; lat += 10) {
      const points: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        points.push(latLonToVector3(lat, lon, GLOBE_RADIUS + 0.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.push(<primitive key={`lat-${lat}`} object={new THREE.Line(geo, material)} />);
    }
    for (let lon = -180; lon < 180; lon += 10) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 4) {
        points.push(latLonToVector3(lat, lon, GLOBE_RADIUS + 0.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.push(<primitive key={`lon-${lon}`} object={new THREE.Line(geo, material)} />);
    }
    return group;
  }, [material]);

  return <>{lines}</>;
}

/** Tactical surveillance boundary and corner brackets for Indian Ocean domain */
function TacticalSurveillanceGrid() {
  const bracketMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#00f0ff',
        opacity: 0.85,
        transparent: true,
      }),
    []
  );

  const borderMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#0284c7',
        opacity: 0.35,
        transparent: true,
      }),
    []
  );

  const { bracketGeo, borderGeo } = useMemo(() => {
    const bracketPoints: THREE.Vector3[] = [];
    const borderPoints: THREE.Vector3[] = [];

    const corners = [
      { lat: 0, lon: 60, dLat: 2.5, dLon: 2.5 },
      { lat: 0, lon: 100, dLat: 2.5, dLon: -2.5 },
      { lat: 28, lon: 60, dLat: -2.5, dLon: 2.5 },
      { lat: 28, lon: 100, dLat: -2.5, dLon: -2.5 },
    ];

    corners.forEach((c) => {
      const pCorner = latLonToVector3(c.lat, c.lon, GLOBE_RADIUS + 0.012);
      const pLat = latLonToVector3(c.lat + c.dLat, c.lon, GLOBE_RADIUS + 0.012);
      const pLon = latLonToVector3(c.lat, c.lon + c.dLon, GLOBE_RADIUS + 0.012);

      bracketPoints.push(pLat, pCorner);
      bracketPoints.push(pCorner, pLon);
    });

    // Perimeter boundary line connecting the surveillance zone
    for (let lon = 60; lon <= 100; lon += 2) {
      borderPoints.push(latLonToVector3(28, lon, GLOBE_RADIUS + 0.01));
    }
    for (let lat = 28; lat >= 0; lat -= 2) {
      borderPoints.push(latLonToVector3(lat, 100, GLOBE_RADIUS + 0.01));
    }
    for (let lon = 100; lon >= 60; lon -= 2) {
      borderPoints.push(latLonToVector3(0, lon, GLOBE_RADIUS + 0.01));
    }
    for (let lat = 0; lat <= 28; lat += 2) {
      borderPoints.push(latLonToVector3(lat, 60, GLOBE_RADIUS + 0.01));
    }

    const bGeo = new THREE.BufferGeometry().setFromPoints(bracketPoints);
    const pGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    return { bracketGeo: bGeo, borderGeo: pGeo };
  }, []);

  return (
    <group>
      <primitive object={new THREE.LineSegments(bracketGeo, bracketMaterial)} />
      <primitive object={new THREE.Line(borderGeo, borderMaterial)} />
    </group>
  );
}

/** Smoothly lerps camera position when user selects a sector or float */
function CameraLerpController({ targetPosition }: { targetPosition?: THREE.Vector3 | null }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    if (targetPosition) {
      camera.position.lerp(targetPosition, Math.min(1, delta * 3.2));
    }
  });
  return null;
}

/** 3D Pulsing Tactical Target Reticle for Probed Coordinate */
function ProbeReticle({ coordinate }: { coordinate: { lat: number; lon: number } }) {
  const pos = latLonToVector3(coordinate.lat, coordinate.lon, GLOBE_RADIUS + 0.015);
  const ringRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1.0 + 0.25 * Math.sin(t * 5);
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={pos}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.035, 24]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** Main Globe component */
export default function Globe({
  sliceData,
  currentVectors = [],
  currentSpeedMin = 0,
  currentSpeedMax = 0.2,
  showCurrents = false,
  argoProfiles = [],
  selectedArgoId = null,
  targetCameraPos = null,
  probedCoordinate = null,
  oceanOpacity = 0.82,
  depthLevels = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500],
  cameraPitch = 50,
  onSelectArgo,
  onProbeCoordinate,
  onContextMenuCoordinate,
  onHoverCoordinate,
}: GlobeProps) {
  const cameraPos = getBayOfBengalCameraPosition(6.8);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{
          position: [cameraPos.x, cameraPos.y, cameraPos.z],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        {/* Enhanced Google Earth-inspired lighting */}
        <ambientLight intensity={0.4} color="#1a237e" />
        <directionalLight 
          position={[15, 8, 12]} 
          intensity={1.8} 
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-8, -4, -10]} intensity={0.5} color="#4fc3f7" />
        <hemisphereLight 
          args={['#87ceeb', '#1a237e', 0.3]} 
        />

        {/* Space Starfield */}
        <Stars radius={80} depth={50} count={4000} factor={4} fade speed={0.5} />

        {/* Dynamic Smooth Camera Transition */}
        <CameraLerpController targetPosition={targetCameraPos} />

        {/* NASA Earth Globe */}
        <Earth />

        {/* Lat/Lon Coordinate Graticule */}
        <GridLines />

        {/* Tactical Indian Ocean Surveillance Boundary Grid */}
        <TacticalSurveillanceGrid />

        {/* Ocean Data Layer with soft edge feathering, click probe, and 60 FPS hover */}
        {sliceData && (
          <OceanDataLayer
            data={sliceData}
            opacity={oceanOpacity}
            onProbe={onProbeCoordinate}
            onContextMenu={onContextMenuCoordinate}
            onHoverCoord={onHoverCoordinate}
          />
        )}

        {/* Tactical Coordinate Probe Reticle */}
        {probedCoordinate && <ProbeReticle coordinate={probedCoordinate} />}

        {/* 3D Subsurface Water Column Depth Slabs matching Image 1 & 2 */}
        {probedCoordinate && sliceData && (
          <SubsurfaceVolumeBlock
            coordinate={probedCoordinate}
            depthLevels={depthLevels}
            currentDepth={sliceData.depth}
            variable={sliceData.variable}
            verticalExaggeration={1.0}
            visible={true}
          />
        )}


        {/* 3D Current Vector Directional Cones */}
        {showCurrents && (
          <CurrentVectors
            vectors={currentVectors}
            speedMin={currentSpeedMin}
            speedMax={currentSpeedMax}
            visible={showCurrents}
          />
        )}

        {/* In-Situ Argo Buoys with Radar Sonar Pings */}
        {argoProfiles.length > 0 && onSelectArgo && (
          <ArgoMarkers
            profiles={argoProfiles}
            selectedId={selectedArgoId}
            onSelect={onSelectArgo}
          />
        )}

        {/* Camera Controls with Dynamic Google Earth Pitch */}
        <OrbitControls
          enablePan={false}
          minDistance={4.0}
          maxDistance={12}
          minPolarAngle={THREE.MathUtils.degToRad(Math.max(15, 90 - cameraPitch))}
          maxPolarAngle={THREE.MathUtils.degToRad(Math.min(130, 90 + cameraPitch))}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
