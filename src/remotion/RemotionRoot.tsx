import {Composition} from 'remotion';
import {SmokeAudioScene} from '../scenes/SmokeAudioScene';
import {SmokeFontScene} from '../scenes/SmokeFontScene';
import {ThreeTestScene} from '../scenes/ThreeTestScene';
import {TestScene2D} from '../scenes/TestScene2D';
import {DEFAULT_DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from '../utils/videoSpec';

/** All story compositions are registered here. 1080x1920 @ 30fps by default. */
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TestComposition"
        component={TestScene2D}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          title: 'AI_STORIES',
          subtitle: 'Remotion · Three.js · FFmpeg',
        }}
      />
      <Composition
        id="ThreeTestComposition"
        component={ThreeTestScene}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SmokeAudioComposition"
        component={SmokeAudioScene}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SmokeFontComposition"
        component={SmokeFontScene}
        durationInFrames={30}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
