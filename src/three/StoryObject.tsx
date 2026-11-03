import {RoundedBox} from '@react-three/drei';
import {useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Deterministic 3D prop: every transform is derived from useCurrentFrame(),
 * never from wall-clock time, so two renders of the same frame match exactly.
 */
export const StoryObject = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;

  const spin = seconds * 0.9;
  const bob = Math.sin(seconds * 1.6) * 0.25;

  return (
    <>
      <group rotation={[spin * 0.35, spin, 0]}>
        <RoundedBox args={[2.2, 2.2, 2.2]} radius={0.26} smoothness={6}>
          <meshStandardMaterial color="#ef5d32" metalness={0.35} roughness={0.28} />
        </RoundedBox>
      </group>
      <mesh position={[1.0, bob, 1.4]}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshStandardMaterial
          color="#3ce0b0"
          emissive="#0a5d4a"
          emissiveIntensity={0.7}
          roughness={0.3}
        />
      </mesh>
    </>
  );
};
