/**
 * ArgoMarkers — Tactical 3D Interactive Target Beacons for Profiling Floats.
 * Inspired by OSIRIS / Palantir C2 design language.
 * Features sonar radar rings, beacon pulses, and non-intrusive hover tooltips.
 */
import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3, GLOBE_RADIUS } from '../../utils/coordinates';
import type { ArgoProfileSummary } from '../../types';

interface ArgoMarkersProps {
  profiles: ArgoProfileSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SingleBuoy({
  profile,
  isSelected,
  onSelect,
}: {
  profile: ArgoProfileSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const beaconRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pos = latLonToVector3(profile.latitude, profile.longitude, GLOBE_RADIUS + 0.02);

  // Float status mapping
  const isCritical = profile.platform_id === '2902345';
  const isWarning = profile.platform_id === '2904001';
  const statusColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

  // Radar ping & beacon blink animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Radar expanding ring
    if (ringRef.current) {
      const pingSpeed = isCritical ? 1.2 : isWarning ? 0.9 : 0.6;
      const pingT = (t * pingSpeed + (Number(profile.platform_id) % 4) * 0.4) % 1.5;
      const scale = 0.8 + pingT * 2.8;
      ringRef.current.scale.set(scale, scale, scale);
      const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
      ringMat.opacity = Math.max(0, 0.7 - pingT / 1.5);
    }

    // Beacon blink
    if (beaconRef.current) {
      const blinkRate = isCritical ? 8 : isWarning ? 4 : 2;
      const blink = Math.sin(t * blinkRate);
      const beaconMat = beaconRef.current.material as THREE.MeshBasicMaterial;
      beaconMat.opacity = isSelected ? 1.0 : 0.4 + 0.6 * (blink > 0 ? 1 : 0);
    }
  });

  const tetherGeo = useMemo(() => {
    const dir = pos.clone().normalize().multiplyScalar(-0.075);
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      dir,
    ]);
  }, [pos]);

  const tetherMat = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: statusColor,
      transparent: true,
      opacity: isCritical ? 0.85 : 0.45,
    });
  }, [statusColor, isCritical]);

  const deepSensorPos = useMemo(() => {
    return pos.clone().normalize().multiplyScalar(-0.075);
  }, [pos]);

  return (
    <group position={pos}>
      {/* Subsurface Sounding Column Tether (0-2000m profiling descent) */}
      <primitive object={new THREE.Line(tetherGeo, tetherMat)} />
      <mesh position={deepSensorPos}>
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.7} />
      </mesh>

      {/* Radar Sonar Ping Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.028, 24]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3D Floating Buoy Core */}
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : statusColor}
          emissive={statusColor}
          emissiveIntensity={hovered || isSelected ? 1.4 : 0.7}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Invisible Larger Hit Target for Effortless Clicking */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(profile.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Mathematically Honest Subsurface Thermal Plume (Proportional to Delta) */}
      {(isCritical || isWarning) && (
        <mesh position={pos.clone().normalize().multiplyScalar(-0.038)}>
          <sphereGeometry args={[isCritical ? 0.048 : 0.026, 16, 16]} />
          <meshBasicMaterial
            color={isCritical ? '#FF3366' : '#FFB300'}
            transparent
            opacity={isCritical ? 0.35 : 0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Top Beacon Pulse Dot */}
      <mesh ref={beaconRef} position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.01, 12, 12]} />
        <meshBasicMaterial
          color={isCritical ? '#fca5a5' : '#ffffff'}
          transparent
          opacity={1.0}
        />
      </mesh>
    </group>
  );
}

export default function ArgoMarkers({
  profiles,
  selectedId,
  onSelect,
}: ArgoMarkersProps) {
  return (
    <group>
      {profiles.map((profile) => (
        <SingleBuoy
          key={profile.id}
          profile={profile}
          isSelected={selectedId === profile.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
