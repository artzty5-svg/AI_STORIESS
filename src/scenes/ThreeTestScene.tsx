import type {CSSProperties} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {StoryObject} from '../three/StoryObject';

const overlay: CSSProperties = {
  position: 'absolute',
  bottom: 180,
  left: 0,
  right: 0,
  textAlign: 'center',
  color: 'white',
  fontFamily: 'Helvetica, Arial, sans-serif',
};

export const ThreeTestScene = () => {
  const {width, height, fps} = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{background: 'linear-gradient(180deg, #0b1026 0%, #2c1147 100%)'}}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [0, 0, 7], fov: 42}}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 8, 6]} intensity={2.6} />
        <pointLight position={[-6, -3, -4]} intensity={45} color="#4a6df0" />
        <StoryObject />
      </ThreeCanvas>
      <div style={overlay}>
        <div style={{fontSize: 58, fontWeight: 700}}>React Three Fiber</div>
        <div style={{fontSize: 34, opacity: 0.75}}>
          frame {frame} · {(frame / fps).toFixed(2)}s · WebGL
        </div>
      </div>
    </AbsoluteFill>
  );
};
