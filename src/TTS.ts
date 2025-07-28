import { v4 } from "uuid";

import { TTSManager, UtteranceConfig } from "./TTSManager";

export const _internal = Symbol("TTSManagerInternal");

/**
 * Possible states of the TTS entity.
 */
export type TTSState = "idle" | "queued" | "playing" | "paused" | "cancelled" | "completed";

/**
 * Single TTS instance
 */
export class TTS {
	private id: string;
	private _state: TTSState = "idle";

	/** The underlying SpeechSynthesisUtterance instance representing the speech to be spoken */
	public readonly utterance: SpeechSynthesisUtterance;

	// Lifecycle callbacks that users of the class can set

	/** Called when the TTS instance is added to the speech queue */
	onQueued?: () => void;
	/** Called when the TTS instance starts playing */
	onPlaying?: () => void;
	/** Called when playback of the TTS instance is paused */
	onPaused?: () => void;
	/** Called when playback of the TTS instance is resumed after a pause */
	onResumed?: () => void;
	/** Called when playback of the TTS instance finishes successfully */
	onCompleted?: () => void;
	/** Called when playback of the TTS instance is cancelled */
	onCancelled?: () => void;

	// Internal methods used by the TTSManager
	private [_internal] = {
		getId: () => this.id,

		// Update and trigger state updates
		isQueued: () => {
			this._state = "queued";
			this.onQueued?.();
		},
		isPlaying: () => {
			this._state = "playing";
			this.onPlaying?.();
		},
		isPaused: () => {
			this._state = "paused";
			this.onPaused?.();
		},
		isResumed: () => {
			this._state = "playing";
			this.onResumed?.();
		},
		isCancelled: () => {
			this._state = "cancelled";
			this.onCancelled?.();
		},
		isCompleted: () => {
			this._state = "completed";
			this.onCompleted?.();
		},
	};

	/**
	 * Retrieve the current state of the TTS instance.
	 */
	public get state(): TTSState {
		return this._state;
	}

	/**
	 * Creates a new TTS instance with the given content.
	 * @param content - The text content to be spoken by this TTS instance.
	 */
	constructor(content: string) {
		this.id = v4();
		this.utterance = new SpeechSynthesisUtterance(content);

		// Apply any global utterance configuration from the TTSManager
		for (const property in TTSManager.config) {
			const value = TTSManager.config[property as keyof UtteranceConfig];
			if (value !== undefined) {
				(this.utterance[property as keyof UtteranceConfig] as any) = value;
			}
		}
	}
}
