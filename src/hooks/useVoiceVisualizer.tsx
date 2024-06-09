import { useEffect, useRef, useState } from "react";

import {
  formatDurationTime,
  formatRecordedAudioTime,
  formatRecordingTime,
  getFileExtensionFromMimeType,
} from "../helpers";
import { Controls, useVoiceVisualizerParams } from "../types/types.ts";

function useVoiceVisualizer({
  onStartRecording,
  onStopRecording,
  onPausedRecording,
  onResumedRecording,
  onClearCanvas,
  onEndAudioPlayback,
  onStartAudioPlayback,
  onPausedAudioPlayback,
  onResumedAudioPlayback,
  onErrorPlayingAudio,
}: useVoiceVisualizerParams = {}): Controls {
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);
  const [isPausedRecording, setIsPausedRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const [isProcessingAudioOnComplete, _setIsProcessingAudioOnComplete] =
    useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [bufferFromRecordedBlob, setBufferFromRecordedBlob] =
    useState<AudioBuffer | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [prevTime, setPrevTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioSrc, setAudioSrc] = useState("");
  const [isPausedRecordedAudio, setIsPausedRecordedAudio] = useState(true);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [isCleared, setIsCleared] = useState(true);
  const [isProcessingOnResize, _setIsProcessingOnResize] = useState(false);
  const [isPreloadedBlob, setIsPreloadedBlob] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessingStartRecording, setIsProcessingStartRecording] =
    useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRecordingRef = useRef<number | null>(null);
  const rafCurrentTimeUpdateRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isAvailableRecordedAudio = Boolean(
    bufferFromRecordedBlob && !isProcessingAudioOnComplete,
  );
  const formattedDuration = formatDurationTime(duration);
  const formattedRecordingTime = formatRecordingTime(recordingTime);
  const formattedRecordedAudioCurrentTime =
    formatRecordedAudioTime(currentAudioTime);
  const isProcessingRecordedAudio =
    isProcessingOnResize || isProcessingAudioOnComplete;

  useEffect(() => {
    if (!isRecordingInProgress || isPausedRecording) return;

    const updateTimer = () => {
      const timeNow = performance.now();
      setRecordingTime((prev) => prev + (timeNow - prevTime));
      setPrevTime(timeNow);
    };

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [prevTime, isPausedRecording, isRecordingInProgress]);

  useEffect(() => {
    if (error) {
      clearCanvas();
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    return () => {
      clearCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isCleared) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isCleared]);

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };

  const processBlob = async (blob: Blob) => {
    if (!blob) return;

    try {
      if (blob.size === 0) {
        throw new Error("Error: The audio blob is empty");
      }
      const audioSrcFromBlob = URL.createObjectURL(blob);
      setAudioSrc(audioSrcFromBlob);

      const audioBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(audioBuffer);
      setBufferFromRecordedBlob(buffer);
      setDuration(buffer.duration - 0.06);

      setError(null);
    } catch (error) {
      console.error("Error processing the audio blob:", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Error processing the audio blob"),
      );
    }
  };

  const setPreloadedAudioBlob = (blob: Blob) => {
    if (blob instanceof Blob) {
      clearCanvas();
      setIsPreloadedBlob(true);
      setIsCleared(false);
      _setIsProcessingAudioOnComplete(true);
      setIsRecordingInProgress(false);
      setRecordingTime(0);
      setIsPausedRecording(false);
      audioRef.current = new Audio();
      setRecordedBlob(blob);
      void processBlob(blob);
    }
  };

  const getUserMedia = () => {
    setIsProcessingStartRecording(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setIsCleared(false);
        setIsProcessingStartRecording(false);
        setIsRecordingInProgress(true);
        setPrevTime(performance.now());
        setAudioStream(stream);
        audioContextRef.current = new window.AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        dataArrayRef.current = new Uint8Array(
          analyserRef.current.frequencyBinCount,
        );
        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.addEventListener(
          "dataavailable",
          handleDataAvailable,
        );
        mediaRecorderRef.current.start();
        if (onStartRecording) onStartRecording();

        recordingFrame();
      })
      .catch((error) => {
        setIsProcessingStartRecording(false);
        setError(
          error instanceof Error
            ? error
            : new Error("Error starting audio recording"),
        );
      });
  };

  const recordingFrame = () => {
    analyserRef.current!.getByteTimeDomainData(dataArrayRef.current!);
    setAudioData(new Uint8Array(dataArrayRef.current!));
    rafRecordingRef.current = requestAnimationFrame(recordingFrame);
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current = null;
    audioRef.current = new Audio();
    setRecordedBlob(event.data);
    void processBlob(event.data);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    setCurrentAudioTime(audioRef.current.currentTime);

    rafCurrentTimeUpdateRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const startRecording = () => {
    if (isRecordingInProgress || isProcessingStartRecording) return;

    if (!isCleared) clearCanvas();
    getUserMedia();
  };

  const stopRecording = () => {
    if (!isRecordingInProgress) return;

    setIsRecordingInProgress(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.removeEventListener(
        "dataavailable",
        handleDataAvailable,
      );
    }
    audioStream?.getTracks().forEach((track) => track.stop());
    if (rafRecordingRef.current) cancelAnimationFrame(rafRecordingRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close();
    }
    _setIsProcessingAudioOnComplete(true);
    setRecordingTime(0);
    setIsPausedRecording(false);
    if (onStopRecording) onStopRecording();
  };

  const clearCanvas = () => {
    if (rafRecordingRef.current) {
      cancelAnimationFrame(rafRecordingRef.current);
      rafRecordingRef.current = null;
    }
    if (rafCurrentTimeUpdateRef.current) {
      cancelAnimationFrame(rafCurrentTimeUpdateRef.current);
      rafCurrentTimeUpdateRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.removeEventListener(
        "dataavailable",
        handleDataAvailable,
      );
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    audioStream?.getTracks().forEach((track) => track.stop());
    if (audioRef?.current) {
      audioRef.current.removeEventListener("ended", onEndedRecordedAudio);
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    sourceRef.current = null;

    setAudioStream(null);
    setIsProcessingStartRecording(false);
    setIsRecordingInProgress(false);
    setIsPreloadedBlob(false);
    _setIsProcessingAudioOnComplete(false);
    setRecordedBlob(null);
    setBufferFromRecordedBlob(null);
    setRecordingTime(0);
    setPrevTime(0);
    setDuration(0);
    setAudioSrc("");
    setCurrentAudioTime(0);
    setIsPausedRecordedAudio(true);
    setIsPausedRecording(false);
    _setIsProcessingOnResize(false);
    setAudioData(new Uint8Array(0));
    setError(null);
    setIsCleared(true);
    if (onClearCanvas) onClearCanvas();
  };

  const startPlayingAudio = () => {
    if (audioRef.current && audioRef.current.paused) {
      const audioPromise = audioRef.current.play();
      if (audioPromise !== undefined) {
        audioPromise.catch((error) => {
          console.error(error);
          if (onErrorPlayingAudio) {
            onErrorPlayingAudio(
              error instanceof Error ? error : new Error("Error playing audio"),
            );
          }
        });
      }
    }
  };

  const togglePauseResume = () => {
    if (isRecordingInProgress) {
      setIsPausedRecording((prevPaused) => !prevPaused);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current?.pause();
        setRecordingTime((prev) => prev + (performance.now() - prevTime));
        if (rafRecordingRef.current) {
          cancelAnimationFrame(rafRecordingRef.current);
        }
        if (onPausedRecording) onPausedRecording();
      } else {
        rafRecordingRef.current = requestAnimationFrame(recordingFrame);
        mediaRecorderRef.current?.resume();
        setPrevTime(performance.now());
        if (onResumedRecording) onResumedRecording();
      }
      return;
    }

    if (audioRef.current && isAvailableRecordedAudio) {
      if (audioRef.current.paused) {
        requestAnimationFrame(handleTimeUpdate);
        startPlayingAudio();
        audioRef.current.addEventListener("ended", onEndedRecordedAudio);
        setIsPausedRecordedAudio(false);
        if (onStartAudioPlayback && currentAudioTime === 0) {
          onStartAudioPlayback();
        }
        if (onResumedAudioPlayback && currentAudioTime !== 0) {
          onResumedAudioPlayback();
        }
      } else {
        if (rafCurrentTimeUpdateRef.current) {
          cancelAnimationFrame(rafCurrentTimeUpdateRef.current);
        }
        audioRef.current.removeEventListener("ended", onEndedRecordedAudio);
        audioRef.current.pause();
        setIsPausedRecordedAudio(true);
        const newCurrentTime = audioRef.current.currentTime;
        setCurrentAudioTime(newCurrentTime);
        audioRef.current.currentTime = newCurrentTime;
        if (onPausedAudioPlayback) onPausedAudioPlayback();
      }
    }
  };

  const onEndedRecordedAudio = () => {
    if (rafCurrentTimeUpdateRef.current) {
      cancelAnimationFrame(rafCurrentTimeUpdateRef.current);
    }
    setIsPausedRecordedAudio(true);
    if (!audioRef?.current) return;
    audioRef.current.currentTime = 0;
    setCurrentAudioTime(0);
    if (onEndAudioPlayback) onEndAudioPlayback();
  };

  const saveAudioFile = () => {
    if (!audioSrc) return;

    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = audioSrc;
    downloadAnchor.download = `recorded_audio${getFileExtensionFromMimeType(
      mediaRecorderRef.current?.mimeType,
    )}`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(audioSrc);
  };

  return {
    audioRef,
    isRecordingInProgress,
    isPausedRecording,
    audioData,
    recordingTime,
    isProcessingRecordedAudio,
    recordedBlob,
    mediaRecorder: mediaRecorderRef.current,
    duration,
    currentAudioTime,
    audioSrc,
    isPausedRecordedAudio,
    bufferFromRecordedBlob,
    isCleared,
    isAvailableRecordedAudio,
    formattedDuration,
    formattedRecordingTime,
    formattedRecordedAudioCurrentTime,
    startRecording,
    togglePauseResume,
    stopRecording,
    saveAudioFile,
    clearCanvas,
    setCurrentAudioTime,
    error,
    isProcessingOnResize,
    isProcessingStartRecording,
    isPreloadedBlob,
    setPreloadedAudioBlob,
    _setIsProcessingAudioOnComplete,
    _setIsProcessingOnResize,
  };
}

export default useVoiceVisualizer;
