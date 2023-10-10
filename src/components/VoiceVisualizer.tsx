import {
  useState,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useRef,
  MutableRefObject,
  MouseEventHandler,
} from "react";

import {
  drawByLiveStream,
  drawByBlob,
  getBarsData,
  initialCanvasSetup,
  formatToInlineStyleValue,
  formatRecordedAudioTime,
  formatRecordingTime,
  formatDurationTime,
} from "../helpers";
import { BarsData, Controls, BarItem } from "../types/types.ts";

import "../index.css";

import MicrophoneIcon from "../assets/MicrophoneIcon.tsx";
import AudioWaveIcon from "../assets/AudioWaveIcon.tsx";
import microphoneIcon from "../assets/microphone.svg";
import playIcon from "../assets/play.svg";
import pauseIcon from "../assets/pause.svg";
import stopIcon from "../assets/stop.svg";

interface VoiceVisualizerProps {
  controls: Controls;
  height?: string | number;
  width?: string | number;
  speed?: number;
  backgroundColor?: string;
  mainBarColor?: string;
  secondaryBarColor?: string;
  barWidth?: number;
  gap?: number;
  rounded?: number;
  fullscreen?: boolean;
  isControlPanelShown?: boolean;
  isDownloadAudioButtonShown?: boolean;
  animateCurrentPick?: boolean;
  onlyRecording?: boolean;
  isDefaultUIShown?: boolean;
  defaultMicrophoneIconColor?: string;
  defaultAudioWaveIconColor?: string;
  mainContainerClassName?: string;
  canvasContainerClassName?: string;
  isProgressIndicatorShown?: boolean;
  progressIndicatorClassName?: string;
  isProgressIndicatorTimeShown?: boolean;
  progressIndicatorTimeClassName?: string;
  isProgressIndicatorOnHoverShown?: boolean;
  progressIndicatorOnHoverClassName?: string;
  isProgressIndicatorTimeOnHoverShown?: boolean;
  progressIndicatorTimeOnHoverClassName?: string;
  isAudioProcessingTextShown?: boolean;
  audioProcessingTextClassName?: string;
  controlButtonsClassName?: string;
}

type Ref = HTMLAudioElement | null;

const VoiceVisualizer = forwardRef<Ref, VoiceVisualizerProps>(
  (
    {
      controls: {
        audioData,
        isRecordingInProgress,
        recordedBlob,
        duration,
        audioSrc,
        currentAudioTime,
        bufferFromRecordedBlob,
        togglePauseResume,
        startRecording,
        stopRecording,
        saveAudioFile,
        recordingTime,
        isAvailableRecordedAudio,
        isPausedRecordedAudio,
        isPausedRecording,
        isProcessingRecordedAudio,
        isCleared,
        clearCanvas,
        _setIsProcessingRecordedAudio,
        _handleTimeUpdate,
      },
      width = "100%",
      height = 200,
      speed = 3,
      backgroundColor = "transparent",
      mainBarColor = "#FFFFFF",
      secondaryBarColor = "#5e5e5e",
      barWidth = 2,
      gap = 1,
      rounded = 5,
      isControlPanelShown = true,
      isDownloadAudioButtonShown = false,
      animateCurrentPick = true,
      fullscreen = false,
      onlyRecording = false,
      isDefaultUIShown = true,
      defaultMicrophoneIconColor = mainBarColor,
      defaultAudioWaveIconColor = mainBarColor,
      mainContainerClassName,
      canvasContainerClassName,
      isProgressIndicatorShown = !onlyRecording,
      progressIndicatorClassName,
      isProgressIndicatorTimeShown = true,
      progressIndicatorTimeClassName,
      isProgressIndicatorOnHoverShown = !onlyRecording,
      progressIndicatorOnHoverClassName,
      isProgressIndicatorTimeOnHoverShown = true,
      progressIndicatorTimeOnHoverClassName,
      isAudioProcessingTextShown = true,
      audioProcessingTextClassName,
      controlButtonsClassName,
    },
    ref,
  ) => {
    const [hoveredOffsetX, setHoveredOffsetX] = useState(0);
    const [barsData, setBarsData] = useState<BarsData[]>([]);
    const [canvasCurrentWidth, setCanvasCurrentWidth] = useState(0);
    const [canvasCurrentHeight, setCanvasCurrentHeight] = useState(0);
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [isRecordedCanvasHovered, setIsRecordedCanvasHovered] =
      useState(false);
    const [screenWidth, setScreenWidth] = useState(0);

    const isMobile = screenWidth < 768;
    const formattedSpeed = Math.trunc(speed);
    const formattedGap = Math.trunc(gap);
    const formattedBarWidth = Math.trunc(
      isMobile && formattedGap > 0 ? barWidth + 1 : barWidth,
    );

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const picksRef = useRef<Array<BarItem | null>>([]);
    const indexSpeedRef = useRef(formattedSpeed);
    const indexRef = useRef(formattedBarWidth);
    const index2Ref = useRef(formattedBarWidth);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);

    const unit = formattedBarWidth + formattedGap * formattedBarWidth;

    useEffect(() => {
      const onResize = () => {
        if (
          !canvasContainerRef.current ||
          !canvasRef.current ||
          !isAvailableRecordedAudio
        )
          return;

        indexSpeedRef.current = formattedSpeed;

        const roundedHeight =
          Math.trunc(
            (canvasContainerRef.current.clientHeight *
              window.devicePixelRatio) /
              2,
          ) * 2;

        setCanvasCurrentWidth(canvasContainerRef.current.clientWidth);
        setCanvasCurrentHeight(roundedHeight);
        setCanvasWidth(
          Math.round(
            canvasContainerRef.current.clientWidth * window.devicePixelRatio,
          ),
        );

        setScreenWidth(window.innerWidth);
      };

      onResize();

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }, [width, isAvailableRecordedAudio]);

    useLayoutEffect(() => {
      if (!canvasRef.current) return;

      if (indexSpeedRef.current >= formattedSpeed || !audioData.length) {
        indexSpeedRef.current = 0;
        drawByLiveStream({
          audioData,
          unit,
          index: indexRef,
          index2: index2Ref,
          canvas: canvasRef.current,
          picks: picksRef.current,
          isRecordingInProgress,
          isPausedRecording: isPausedRecording,
          backgroundColor,
          mainBarColor,
          secondaryBarColor,
          barWidth: formattedBarWidth,
          rounded,
          animateCurrentPick,
          fullscreen,
        });
      }

      indexSpeedRef.current += 1;
    }, [
      canvasRef.current,
      audioData,
      formattedBarWidth,
      backgroundColor,
      mainBarColor,
      secondaryBarColor,
      rounded,
      fullscreen,
      isDefaultUIShown,
      canvasWidth,
    ]);

    useEffect(() => {
      if (!isAvailableRecordedAudio) return;

      if (isRecordedCanvasHovered) {
        canvasRef.current?.addEventListener("mouseleave", hideTimeIndicator);
      } else {
        canvasRef.current?.addEventListener("mouseenter", showTimeIndicator);
      }

      return () => {
        if (isRecordedCanvasHovered) {
          canvasRef.current?.removeEventListener(
            "mouseleave",
            hideTimeIndicator,
          );
        } else {
          canvasRef.current?.removeEventListener(
            "mouseenter",
            showTimeIndicator,
          );
        }
      };
    }, [isRecordedCanvasHovered, isAvailableRecordedAudio]);

    useEffect(() => {
      if (
        !bufferFromRecordedBlob ||
        !canvasRef.current ||
        isRecordingInProgress
      ) {
        return;
      }

      if (onlyRecording) {
        clearCanvas();
        return;
      }

      picksRef.current = [];

      const newBarsData = getBarsData({
        buffer: bufferFromRecordedBlob,
        height: canvasCurrentHeight,
        width: canvasWidth,
        barWidth: formattedBarWidth,
        gap: formattedGap,
      });

      setBarsData(newBarsData);

      canvasRef.current?.addEventListener(
        "mousemove",
        setCurrentHoveredOffsetX,
      );

      return () => {
        canvasRef.current?.removeEventListener(
          "mousemove",
          setCurrentHoveredOffsetX,
        );
      };
    }, [
      bufferFromRecordedBlob,
      canvasCurrentWidth,
      canvasCurrentHeight,
      gap,
      barWidth,
    ]);

    useEffect(() => {
      if (onlyRecording || !barsData?.length || !canvasRef.current) return;

      if (isCleared) {
        setBarsData([]);
        return;
      }

      drawByBlob({
        barsData,
        canvas: canvasRef.current,
        barWidth: formattedBarWidth,
        gap: formattedGap,
        backgroundColor,
        mainBarColor,
        secondaryBarColor,
        currentAudioTime,
        rounded,
        duration,
      });

      _setIsProcessingRecordedAudio(false);
    }, [
      barsData,
      currentAudioTime,
      isCleared,
      rounded,
      backgroundColor,
      mainBarColor,
      secondaryBarColor,
    ]);

    useEffect(() => {
      if (isProcessingRecordedAudio && canvasRef.current) {
        initialCanvasSetup({
          canvas: canvasRef.current,
          backgroundColor,
        });
      }
    }, [isProcessingRecordedAudio]);

    const showTimeIndicator = () => {
      setIsRecordedCanvasHovered(true);
    };

    const hideTimeIndicator = () => {
      setIsRecordedCanvasHovered(false);
    };

    const setCurrentHoveredOffsetX = (e: MouseEvent) => {
      setHoveredOffsetX(e.offsetX);
    };

    const handleRecordedAudioCurrentTime: MouseEventHandler<
      HTMLCanvasElement
    > = (e) => {
      if (
        (ref as MutableRefObject<HTMLAudioElement>)?.current &&
        canvasRef.current
      ) {
        (ref as MutableRefObject<HTMLAudioElement>).current.currentTime =
          (duration / canvasCurrentWidth) *
          (e.clientX - canvasRef.current.getBoundingClientRect().left);
      }
    };

    return (
      <div className={`voice-visualizer ${mainContainerClassName ?? ""}`}>
        <div
          className={`voice-visualizer__canvas-container ${
            canvasContainerClassName ?? ""
          }`}
          ref={canvasContainerRef}
          style={{ width: formatToInlineStyleValue(width) }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasCurrentHeight}
            onClick={handleRecordedAudioCurrentTime}
            style={{
              height: formatToInlineStyleValue(height),
              width: canvasCurrentWidth,
            }}
          >
            Your browser does not support HTML5 Canvas.
          </canvas>
          {isDefaultUIShown && isCleared && (
            <>
              <AudioWaveIcon color={defaultAudioWaveIconColor} />
              <AudioWaveIcon color={defaultAudioWaveIconColor} reflect />
              <button
                onClick={startRecording}
                className="voice-visualizer__canvas-microphone-btn"
              >
                <MicrophoneIcon
                  color={defaultMicrophoneIconColor}
                  stroke={0.5}
                  className="voice-visualizer__canvas-microphone-icon"
                />
              </button>
            </>
          )}
          {isAudioProcessingTextShown && isProcessingRecordedAudio && (
            <p
              className={`voice-visualizer__canvas-audio-processing ${
                audioProcessingTextClassName ?? ""
              }`}
              style={{ color: mainBarColor }}
            >
              Processing Audio...
            </p>
          )}
          {isRecordedCanvasHovered &&
            isAvailableRecordedAudio &&
            !isMobile &&
            isProgressIndicatorOnHoverShown && (
              <div
                className={`voice-visualizer__progress-indicator-hovered ${
                  progressIndicatorOnHoverClassName ?? ""
                }`}
                style={{
                  left: hoveredOffsetX,
                }}
              >
                {isProgressIndicatorTimeOnHoverShown && (
                  <p
                    className={`voice-visualizer__progress-indicator-hovered-time 
                    ${
                      canvasCurrentWidth - hoveredOffsetX < 70
                        ? "voice-visualizer__progress-indicator-hovered-time-left"
                        : ""
                    } 
                    ${progressIndicatorTimeOnHoverClassName ?? ""}`}
                  >
                    {formatRecordedAudioTime(
                      (duration / canvasCurrentWidth) * hoveredOffsetX,
                    )}
                  </p>
                )}
              </div>
            )}
          {isProgressIndicatorShown && isAvailableRecordedAudio && duration ? (
            <div
              className={`voice-visualizer__progress-indicator ${
                progressIndicatorClassName ?? ""
              }`}
              style={{
                left: (currentAudioTime / duration) * canvasCurrentWidth,
              }}
            >
              {isProgressIndicatorTimeShown && (
                <p
                  className={`voice-visualizer__progress-indicator-time ${
                    canvasCurrentWidth -
                      (currentAudioTime * canvasCurrentWidth) / duration <
                    70
                      ? "voice-visualizer__progress-indicator-time-left"
                      : ""
                  } ${progressIndicatorTimeClassName ?? ""}`}
                >
                  {formatRecordedAudioTime(currentAudioTime)}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {isControlPanelShown && (
          <>
            <div className="voice-visualizer__audio-info-container">
              {isRecordingInProgress && (
                <p className="voice-visualizer__audio-info-time">
                  {formatRecordingTime(recordingTime)}
                </p>
              )}
              {duration && !isProcessingRecordedAudio ? (
                <p>{formatDurationTime(duration)}</p>
              ) : null}
            </div>

            <div className="voice-visualizer__buttons-container">
              {isRecordingInProgress && (
                <button
                  className={`voice-visualizer__btn-left ${
                    isPausedRecording
                      ? "voice-visualizer__btn-left-microphone"
                      : ""
                  }`}
                  onClick={togglePauseResume}
                >
                  <img
                    src={isPausedRecording ? microphoneIcon : pauseIcon}
                    alt={isPausedRecording ? "Play" : "Pause"}
                  />
                </button>
              )}
              {!isCleared && (
                <button
                  className={`voice-visualizer__btn-left ${
                    isRecordingInProgress
                      ? "voice-visualizer__visually-hidden"
                      : ""
                  }`}
                  onClick={togglePauseResume}
                  disabled={isProcessingRecordedAudio}
                >
                  <img
                    src={isPausedRecordedAudio ? playIcon : pauseIcon}
                    alt={isPausedRecordedAudio ? "Play" : "Pause"}
                  />
                </button>
              )}
              {isCleared && (
                <button
                  className="voice-visualizer__btn-center"
                  onClick={startRecording}
                >
                  <img src={microphoneIcon} alt="Microphone" />
                </button>
              )}
              <button
                className={`voice-visualizer__btn-center voice-visualizer__btn-center-pause ${
                  !isRecordingInProgress
                    ? "voice-visualizer__visually-hidden"
                    : ""
                }`}
                onClick={stopRecording}
              >
                <img src={stopIcon} alt="Stop" />
              </button>
              {!isCleared && (
                <button
                  onClick={clearCanvas}
                  className={`voice-visualizer__btn ${
                    controlButtonsClassName ?? ""
                  }`}
                  disabled={isProcessingRecordedAudio}
                >
                  Clear
                </button>
              )}
              {isDownloadAudioButtonShown && recordedBlob && (
                <button
                  onClick={saveAudioFile}
                  className={`voice-visualizer__btn ${
                    controlButtonsClassName ?? ""
                  }`}
                  disabled={isProcessingRecordedAudio}
                >
                  Download Audio
                </button>
              )}
            </div>
          </>
        )}

        {isAvailableRecordedAudio && (
          <audio
            ref={ref}
            src={audioSrc}
            onTimeUpdate={_handleTimeUpdate}
            controls={true}
            style={{ display: "none" }}
          />
        )}
      </div>
    );
  },
);

export default VoiceVisualizer;
