import  { useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag, usePinch } from 'react-use-gesture';
import { useFrameContext } from '../App'; // Jibna l'context dyal frame men App.jsx

const ViewerModule = ({ activeView }) => {
  const containerRef = useRef(null); // Hna kayn l'ref dyal container
  const totalFrames = 140; // L'3dad dyal lframes kima f l'image sequence
  const accumulatedDelta = useRef(0); // Hna kayn laccumulated delta bash n7sbou ch7al dyal movement tl3t

  // N7ssou 3la lframe mn l'context dyal App.jsx
  const { currentFrame, setCurrentFrame } = useFrameContext();

  // L'paths dyal l'image sequences
  const viewPathPatterns = {
    aerienne: '/assets/sequences/aerial/aerial/{frame}.png',
    villas: '/assets/sequences/villas/villas/{frame}.png',
    parcelles: '/assets/sequences/Parcelles/{frame}.png',
  };

  // Variables li ghadi nst3mlo 3la l'image
  const [imageLoaded, setImageLoaded] = useState(false); // L'image l7ala dyal loading
  const [imageError, setImageError] = useState(false); // Error f loading
  const [isDragging, setIsDragging] = useState(false); // Wach l'image katdrb f screen

  // Spring animation dyal zoom
  const [{ zoom }, setZoom] = useSpring(() => ({
    zoom: 1.7,
    config: { mass: 1, tension: 300, friction: 40 },
  }));

  useEffect(() => {
    setImageLoaded(false); // L'image machi m7milah
    setImageError(false); // Mch kayn chi error
    accumulatedDelta.current = 0; // Nbadlou delta m3a l'view change
  }, [activeView]);

  // N7kmu lmovements dyal luser 3la kayna l7raka b klidat
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        // L'ArrowLeft daba katsir li tl3t limage (yani katdir l3aks dial l2bal)
        setCurrentFrame((prev) => (prev < totalFrames ? prev + 1 : 1));
        break;
      case 'ArrowRight':
        // L'ArrowRight daba katsir li l9dam (yani katdir l3aks dial l2bal)
        setCurrentFrame((prev) => (prev > 1 ? prev - 1 : totalFrames));
        break;
      case 'ArrowUp':
        // Ziadat zoom
        setZoom.start({ zoom: Math.min(5, zoom.get() + 0.1) }); // Ziyadna max zoom l 5
        break;
      case 'ArrowDown':
        // N9s l zoom
        setZoom.start({ zoom: Math.max(0.5, zoom.get() - 0.1) });
        break;
      default:
        break;
    }
  };

  // N7llou l'keyboard event bash nst3mlo keys
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown); // N7tt event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown); // F lreturn, nsayb event listener
    };
  }, [zoom.get]);

  // Hna n9mchiw ma3a drag gestures (dragging image)
  const bindDrag = useDrag(({ delta: [dx], dragging }) => {
    setIsDragging(dragging); // Wach drag kayn awla la?
    accumulatedDelta.current -= dx * 0.3; // T7sb movement

    const deltaFrames = Math.round(accumulatedDelta.current / 7); // 7 f lcalcul

    if (deltaFrames !== 0) {
      setCurrentFrame((prev) => {
        let newFrame = prev + deltaFrames;

        if (newFrame > totalFrames) {
          newFrame = (newFrame % totalFrames) || totalFrames;
        } else if (newFrame < 1) {
          newFrame = totalFrames - (Math.abs(newFrame) % totalFrames);
        }

        return newFrame; // Nbdlou lframe
      });

      accumulatedDelta.current -= deltaFrames * 7; // T7sb final delta
    }
  }, { axis: 'x' });

  // Hna nst3mlou pinch gesture l zoom
  const bindPinch = usePinch(({ offset: [d] }) => {
    setZoom.start({ zoom: Math.max(0.5, Math.min(5, d)) }); // Ziyadna max zoom l 5
  });

  // Hna katmchi wheel event l zoom
  const handleWheel = (e) => {
    e.preventDefault(); // Mazal ma kaynch movement m3a wheel
    setZoom.start({
      zoom: Math.max(0.5, Math.min(5, zoom.get() + (e.deltaY < 0 ? 0.1 : -0.1))), // T7sb movement m3a wheel
    });
  };

  // Lfunction li kaykhdmo 3la tariq path dyal limage
  const getCurrentImagePath = useCallback(() => {
    const paddedFrame = String(currentFrame).padStart(4, '0');
    return viewPathPatterns[activeView].replace('{frame}', paddedFrame);
  }, [currentFrame, activeView]);

  return (
    <div
      {...bindDrag()} // Drag handler
      {...bindPinch()} // Pinch handler
      ref={containerRef} // Ref dyal container
      className="viewer-module"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }} // Cursor style
      onWheel={handleWheel}  // Attach the wheel event handler here
    >
      <animated.div className="viewer-content" style={{ scale: zoom, touchAction: 'none' }}>
        <img
          src={getCurrentImagePath()} // Load image
          alt={`View ${activeView} (${currentFrame}/${totalFrames})`}
          className={`viewer-image ${imageLoaded ? 'loaded' : 'loading'}`}
          onLoad={() => setImageLoaded(true)} // Handle loading state
          onError={() => setImageError(true)} // Handle error
          draggable={false} // Prevent dragging the image
        />

        {imageError && (
          <div className="image-error"> {/* Error message */}
            <span className="error-icon">⚠️</span>
            <p className="error-text">Image not available</p>
            <p className="error-path">{getCurrentImagePath()}</p>
          </div>
        )}

        {!imageLoaded && !imageError && (
          <div className="loading-overlay"> {/* Loading spinner */}
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading...</p>
              <div className="loading-progress-bar">
                <div
                  className="loading-progress-fill"
                  style={{ width: `${(currentFrame / totalFrames) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </animated.div>

      <div className="zoom-controls"> {/* Zoom controls */}
        <button
          className="zoom-btn zoom-in"
          onClick={() => setZoom.start({ zoom: Math.min(5, zoom.get() + 0.1) })} // Increase zoom limit to 5
        >
          +
        </button>
        <button
          className="zoom-btn zoom-out"
          onClick={() => setZoom.start({ zoom: Math.max(0.5, zoom.get() - 0.1) })}
        >
          -
        </button>
      </div>

      <div className="frame-counter">
        {currentFrame}/{totalFrames} {/* Frame counter */}
      </div>

      <div className="sidebar">
        <label htmlFor="frame-slider">Frame:</label>
        <input
          id="frame-slider"
          type="range"
          min="1"
          max={totalFrames}
          value={currentFrame}
          onChange={(e) => setCurrentFrame(parseInt(e.target.value, 10))} // Slider for frame
        />
      </div>
    </div>
  );
};

export default ViewerModule;
