
import { TTS, _internal } from "./TTS";

export type UtteranceConfig = Partial<Pick<SpeechSynthesisUtterance, "lang" | "pitch" | "rate" | "voice" | "volume">>;

export class TTSManager {
	private static ttsQueue: TTS[] = [];
	private static cancelController: AbortController = new AbortController();
	public static config: UtteranceConfig = {};

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

		oldQueue.forEach((tts) => tts[_internal].isCancelled());

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

	public static updateConfig(updates: UtteranceConfig) {
		this.config = { ...this.config, ...updates };
	}
}
