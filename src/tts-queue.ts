import { v4 } from "uuid";

const _internal = Symbol("TTSManagerInternal");

type TTSState = "idle" | "pending" | "playing" | "paused" | "cancelled" | "completed";

// todo update states
// todo call callbacks
// todo pause/resume
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

	// private [_internal] = {
	// 	getId: () => this.id,

	// 	play: async () => {
	// 		return new Promise<void>((resolve, reject) => {
	// 			this.utterance.onend = () => {
	// 				this.onCompleted?.();
	// 				resolve();
	// 			};

	// 			speechSynthesis.speak(this.utterance);
	// 		});
	// 	},

	// 	pause: () => {
	// 		this.onPaused?.();
	// 		speechSynthesis.pause();
	// 	},

	// 	cancel: () => {},
	// 	resume: () => {},
	// };

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

    if (this.ttsQueue.length === 1)
    {
      this.playNext();
    }
  }

	public static cancel(tts: TTS) {
    // todo
  }

	public static cancelAll() {
    // todo
  }

	public static pause() {
    // todo
  }

	public static resume() {
    // todo
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
		if (this.ttsQueue.length > 0) {
			const tts = this.ttsQueue[0];

			await this.playUtterance(tts.utterance);
      this.ttsQueue.splice(0, 1);

      this.playNext();
		}
	}
}
