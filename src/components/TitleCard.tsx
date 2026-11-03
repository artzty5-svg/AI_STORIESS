import type {CSSProperties} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {useEntrance} from '../animations/entrance';
import {asset} from '../utils/assets';

type TitleCardProps = {
  title: string;
  subtitle?: string;
  imageSrc?: string;
};

const styles: Record<string, CSSProperties> = {
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: 'white',
    textAlign: 'center',
  },
  image: {
    width: 620,
    height: 620,
    objectFit: 'cover',
    borderRadius: 40,
    boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
  },
  title: {fontSize: 92, fontWeight: 700, letterSpacing: -2, margin: 0},
  subtitle: {fontSize: 40, fontWeight: 400, opacity: 0.8, margin: 0},
};

export const TitleCard = ({title, subtitle, imageSrc}: TitleCardProps) => {
  const titleMotion = useEntrance({delayInFrames: 6});
  const imageMotion = useEntrance({delayInFrames: 0, damping: 18});

  return (
    <AbsoluteFill style={styles.wrap}>
      {imageSrc ? (
        <div
          style={{
            opacity: imageMotion.opacity,
            transform: `scale(${imageMotion.scale})`,
          }}
        >
          <Img src={asset(imageSrc)} style={styles.image} />
        </div>
      ) : null}
      <div
        style={{
          opacity: titleMotion.opacity,
          transform: `translateY(${titleMotion.offsetY}px) scale(${titleMotion.scale})`,
        }}
      >
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
      </div>
    </AbsoluteFill>
  );
};
