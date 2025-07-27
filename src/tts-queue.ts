import { v4 } from "uuid";

const _internal = Symbol("TTSManagerInternal");

type TTSState = "idle" | "pending" | "playing" | "paused" | "cancelled" | "completed";

// todo update states
// todo call callbacks
// todo cancellation

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

	public static enqueue(tts: TTS) {
		this.ttsQueue.push(tts);

		if (this.ttsQueue.length === 1) {
			this.playNext();
		}
	}

	public static cancel(tts: TTS) {
		const ttsIdx = this.ttsQueue.findIndex((t) => t[_internal].getId() === tts[_internal].getId());

		if (ttsIdx >= 0) {
			// todo cancel playing if it is that one
			this.ttsQueue.splice(ttsIdx, 1);
		}
	}

	public static cancelAll() {
		// todo
	}

	public static pause() {
		speechSynthesis.pause();
	}

	public static resume() {
		speechSynthesis.resume();
	}

	private static getThisTts(): TTS | null {
		if (this.ttsQueue.length <= 0) {
			return null;
		}

		return this.ttsQueue[0];
	}

	private static async playUtterance(utterance: SpeechSynthesisUtterance) {
		return new Promise<void>((resolve, reject) => {
			utterance.onend = () => {
				resolve();
			};

			speechSynthesis.speak(utterance);
		});
	}

	private static async playNext() {
    const tts = this.getThisTts();
		if (tts) {
			await this.playUtterance(tts.utterance);
			this.ttsQueue.splice(0, 1);

			this.playNext();
		}
	}
}
