import { v4 } from "uuid";

import { TTSManager, UtteranceConfig } from "./TTSManager";

export const _internal = Symbol("TTSManagerInternal");

export type TTSState = "idle" | "queued" | "playing" | "paused" | "cancelled" | "completed";

export class TTS {
	private id: string;
	private _state: TTSState = "idle";

	public readonly utterance: SpeechSynthesisUtterance;

	// Callbacks
	onQueued?: () => void;
	onPlaying?: () => void;
	onPaused?: () => void;
	onResumed?: () => void;
	onCancelled?: () => void;
	onCompleted?: () => void;

	private [_internal] = {
		getId: () => this.id,

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

	public get state(): TTSState {
		return this._state;
	}

	constructor(content: string) {
		this.id = v4();
		this.utterance = new SpeechSynthesisUtterance(content);

		if (TTSManager.config) {
			for (const property in TTSManager.config) {
				const value = TTSManager.config[property as keyof UtteranceConfig];
				if (value !== undefined) {
					(this.utterance[property as keyof UtteranceConfig] as any) = value;
				}
			}
		}
	}
}
