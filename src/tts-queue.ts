import { v4 } from "uuid";

const _internal = Symbol("TTSManagerInternal");

type TTSState = "idle" | "queued" | "playing" | "paused" | "cancelled" | "completed";

// todo default utterance properties?

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
	}
}

export class TTSManager {
	private static ttsQueue: TTS[] = [];
	private static cancelController: AbortController = new AbortController();

	public static enqueue(tts: TTS) {
		this.ttsQueue.push(tts);
		tts[_internal].isQueued();

		if (this.ttsQueue.length === 1) {
			this.playNext();
		}
	}

	public static cancel(tts: TTS) {
		const ttsIdx = this.ttsQueue.findIndex((t) => t[_internal].getId() === tts[_internal].getId());

		if (ttsIdx >= 0) {
			tts[_internal].isCancelled();

			if (ttsIdx === 0) {
        this.cancelController.abort();
        speechSynthesis.cancel();
			}
			this.ttsQueue.splice(ttsIdx, 1);
		}
	}

	public static cancelAll() {
		const oldQueue = this.ttsQueue.splice(0);

    oldQueue.forEach(tts => tts[_internal].isCancelled());

    this.cancelController.abort();
    speechSynthesis.cancel();

	}

	public static pause() {
		const tts = this.getThisTts();

		if (tts) {
			speechSynthesis.pause();
			tts[_internal].isPaused();
		}
	}

	public static resume() {
		const tts = this.getThisTts();

		if (tts) {
			speechSynthesis.resume();
			tts[_internal].isResumed();
		}
	}

	private static getThisTts(): TTS | null {
		if (this.ttsQueue.length <= 0) {
			return null;
		}

		return this.ttsQueue[0];
	}

	private static async playUtterance(utterance: SpeechSynthesisUtterance) {
		return new Promise<void>((resolve, reject) => {
      this.cancelController = new AbortController();
			this.cancelController.signal.onabort = () => {
				reject();
			};

			utterance.onend = () => {
				resolve();
			};

			speechSynthesis.speak(utterance);
		});
	}

	private static async playNext() {
		const tts = this.getThisTts();
		if (tts) {
			tts[_internal].isPlaying();
			try {
				await this.playUtterance(tts.utterance);

				this.ttsQueue.splice(0, 1);
				tts[_internal].isCompleted();
			} catch {
				// Cancelled during playback
        // This would have already removed it from the queue
			}

			this.playNext();
		}
	}
}
