import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import React from 'react';

export const PromoVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Background Fade In (Subtle)
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // 2. Logo Animation
  const logoScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });
  
  const logoY = interpolate(
    frame, 
    [45, 90], 
    [0, -80], 
    { extrapolateRight: 'clamp', easing: (t) => t * (2 - t) } // Ease out
  );

  // 3. Title Animation
  const titleOpacity = interpolate(frame, [50, 80], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(
    frame, 
    [50, 80], 
    [50, 0], 
    { extrapolateRight: 'clamp', easing: (t) => t * (2 - t) }
  );

  // 4. Subtitle Animation
  const subOpacity = interpolate(frame, [70, 100], [0, 1], { extrapolateRight: 'clamp' });
  const subY = interpolate(
    frame, 
    [70, 100], 
    [20, 0], 
    { extrapolateRight: 'clamp', easing: (t) => t * (2 - t) }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: 'white', opacity: bgOpacity }}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ transform: `translateY(${logoY}px)` }}>
                <Img
                    src={staticFile('/Worktree Logo.svg')}
                    style={{
                        width: 400,
                        transform: `scale(${logoScale})`,
                    }}
                />
            </div>
            
            <div style={{ 
                position: 'absolute',
                top: '55%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`
            }}>
                <h1 style={{ 
                    fontFamily: 'Inter, system-ui, sans-serif', 
                    fontSize: 80, 
                    fontWeight: 800, 
                    color: '#0055B8', // Primary Blue
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>
                    Worktree
                </h1>
                <div style={{ 
                    opacity: subOpacity,
                    transform: `translateY(${subY}px)`,
                    marginTop: 16
                }}>
                    <h2 style={{ 
                        fontFamily: 'Inter, system-ui, sans-serif', 
                        fontSize: 32, 
                        fontWeight: 500, 
                        color: '#15803d', // Brand Green
                        margin: 0 
                    }}>
                        Streamline your workflow
                    </h2>
                </div>
            </div>
        </AbsoluteFill>
    </AbsoluteFill>
  );
};
