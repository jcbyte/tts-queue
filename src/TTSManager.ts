import { TTS, _internal } from "./TTS";

/**
 * Partial configuration for `SpeechSynthesisUtterance` properties that can be globally applied to all utterances managed by the TTSManager.
 */
export type UtteranceConfig = Partial<Pick<SpeechSynthesisUtterance, "lang" | "pitch" | "rate" | "voice" | "volume">>;

/**
 * Manages a queue of TTS instance for sequential playback, providing controls to enqueue, cancel, pause, resume, and configure global speech synthesis settings.
 */
export class TTSManager {
	private static ttsQueue: TTS[] = [];
	private static cancelController: AbortController = new AbortController();

	/** Global configuration applied to all new TTS instances */
	public static config: UtteranceConfig = {};

	/**
	 * Adds a TTS instance to the playback queue.
	 * If the queue was empty, starts playback immediately.
	 *
	 * @param tts - The TTS instance to enqueue.
	 */
	public static enqueue(tts: TTS) {
		this.ttsQueue.push(tts);
		tts[_internal].isQueued();

		// If the queue was empty begin playing
		if (this.ttsQueue.length === 1) {
			this.playNext();
		}
	}

	/**
	 * Cancels a specific TTS instance in the queue.
	 *
	 * @param tts - The TTS instance to cancel.
	 */
	public static cancel(tts: TTS) {
		const ttsIdx = this.ttsQueue.findIndex((t) => t[_internal].getId() === tts[_internal].getId());

		if (ttsIdx >= 0) {
			tts[_internal].isCancelled();

			// If this is the currently playing TTS instance then cancel its playback
			if (ttsIdx === 0) {
				this.cancelController.abort();
				speechSynthesis.cancel();
			}

			// Remove it from the queue
			this.ttsQueue.splice(ttsIdx, 1);
		}
	}

	/**
	 * Cancels all queued TTS instances and stop playback immediately.
	 */
	public static cancelAll() {
		// Remove all elements from `this.ttsQueue` and copy them into `oldQueue`
		const oldQueue = this.ttsQueue.splice(0);

		oldQueue.forEach((tts) => tts[_internal].isCancelled());

		this.cancelController.abort();
		speechSynthesis.cancel();
	}

	/**
	 * Pauses the currently playing TTS instance, if any.
	 */
	public static pause() {
		const tts = this.getThisTts();

		if (tts) {
			speechSynthesis.pause();
			tts[_internal].isPaused();
		}
	}

	/**
	 * Resumes playback of the currently paused TTS instance, if any.
	 */
	public static resume() {
		const tts = this.getThisTts();

		if (tts) {
			speechSynthesis.resume();
			tts[_internal].isResumed();
		}
	}

	/**
	 * Returns the currently playing TTS instance, or null if none.
	 *
	 * @returns The currently playing TTS instance, or null.
	 */
	private static getThisTts(): TTS | null {
		if (this.ttsQueue.length <= 0) {
			return null;
		}

		return this.ttsQueue[0];
	}

	/**
	 * Plays a given `SpeechSynthesisUtterance` and resolves when playback completes.
	 * Rejects if playback is cancelled via abortion by the cancelController.
	 *
	 * @param utterance - The utterance to be spoken.
	 * @returns Promise that resolves on utterance end, rejects if cancelled.
	 */
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

	/**
	 * Plays the next TTS instance in the queue recursively until empty.
	 */
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

			// Recursively play all TTS instances in the queue
			this.playNext();
		}
	}

	/**
	 * Updates the global configuration applied to new TTS instances.
	 *
	 * @param updates - Configuration updates to merge with existing settings.
	 */
	public static updateConfig(updates: Partial<UtteranceConfig>) {
		this.config = { ...this.config, ...updates };
	}
}
