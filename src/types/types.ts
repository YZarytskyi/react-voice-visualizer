import { Dispatch, MutableRefObject, SetStateAction } from "react";

export interface BarItem {
  startY: number;
  barHeight: number;
}

export interface Controls {
  isRecordingInProgress: boolean;
  isPausedRecording: boolean;
  audioData: Uint8Array;
  recordingTime: number;
  mediaRecorder: MediaRecorder | null;
  duration: number;
  currentAudioTime: number;
  audioSrc: string;
  isPausedRecordedAudio: boolean;
  isProcessingRecordedAudio: boolean;
  isCleared: boolean;
  isAvailableRecordedAudio: boolean;
  isPreloadedBlob: boolean;
  setPreloadedAudioBlob: (blob: unknown) => void;
  recordedBlob: Blob | null;
  bufferFromRecordedBlob: AudioBuffer | null;
  formattedDuration: string;
  formattedRecordingTime: string;
  formattedRecordedAudioCurrentTime: string;
  startRecording: () => void;
  togglePauseResume: () => void;
  stopRecording: () => void;
  saveAudioFile: () => void;
  clearCanvas: () => void;
  setCurrentAudioTime: Dispatch<SetStateAction<number>>;
  error: Error | null;
  _setIsProcessingRecordedAudio: Dispatch<SetStateAction<boolean>>;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
}

export interface BarsData {
  max: number;
}

export interface DrawByLiveStreamParams {
  audioData: Uint8Array;
  unit: number;
  index: MutableRefObject<number>;
  index2: MutableRefObject<number>;
  canvas: HTMLCanvasElement;
  isRecordingInProgress: boolean;
  isPausedRecording: boolean;
  picks: Array<BarItem | null>;
  backgroundColor: string;
  barWidth: number;
  mainBarColor: string;
  secondaryBarColor: string;
  rounded: number;
  animateCurrentPick: boolean;
  fullscreen: boolean;
}

export interface DrawByBlob {
  barsData: BarsData[];
  canvas: HTMLCanvasElement;
  barWidth: number;
  gap: number;
  backgroundColor: string;
  mainBarColor: string;
  secondaryBarColor: string;
  currentAudioTime?: number;
  rounded: number;
  duration: number;
}

export interface PaintLineFromCenterToRightParams {
  context: CanvasRenderingContext2D;
  color: string;
  rounded: number;
  width: number;
  height: number;
  barWidth: number;
}

export interface GetDataForCanvasParams {
  canvas: HTMLCanvasElement;
  backgroundColor: string;
}

export interface PaintLineParams {
  context: CanvasRenderingContext2D;
  color: string;
  rounded: number | number[];
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GetBarsDataParams = {
  bufferData: Float32Array;
  height: number;
  width: number;
  barWidth: number;
  gap: number;
};

export interface useVoiceVisualizerParams {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onPausedRecording?: () => void;
  onResumedRecording?: () => void;
  onClearCanvas?: () => void;
  onEndAudioPlayback?: () => void;
  onStartAudioPlayback?: () => void;
  onPausedAudioPlayback?: () => void;
  onResumedAudioPlayback?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;
