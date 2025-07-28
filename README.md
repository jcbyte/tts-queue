# tts-queue

Provides a wrapper for the Web API SpeechSynthesis methods to handle them more easily.

## Installation

```bash
npm i @jcbyte/tts-queue
```

## Usage

### Basic Usage

```ts
import { TTS, TTSManager } from "@jcbyte/tts-queue";

// Create a new TTS instance
const tts = new TTS("Hello, this is a test of the TTS queue.");

// Optional: Set lifecycle callbacks
tts.onQueued = () => console.log("TTS instance queued");
tts.onPlaying = () => console.log("TTS instance started playing");
tts.onPaused = () => console.log("TTS instance paused");
tts.onResumed = () => console.log("TTS instance resumed");
tts.onCompleted = () => console.log("TTS instance completed");
tts.onCancelled = () => console.log("TTS instance cancelled");

// Enqueue the TTS instance to start playback
TTSManager.enqueue(tts);

// ...

// Access the current state of the TTS instance ("idle", "queued", "playing", etc.)
console.log(tts.state);
```

### Managing Playback

```ts
// Pause the currently playing TTS instance
TTSManager.pause();

// Resume the paused TTS instance
TTSManager.resume();

// Cancel a specific TTS instance (e.g., the one created above)
TTSManager.cancel(tts);

// Cancel all TTS instances in the queue and stop playback immediately
TTSManager.cancelAll();
```

### Global Configuration

You can set or update the global utterance configuration (e.g., language, pitch, rate, voice, volume) that will be applied to all newly created TTS instances:

```ts
TTSManager.updateConfig({
  lang: "en-US",
  pitch: 1.2,
  rate: 1,
  volume: 0.8,
  // voice: yourSpeechSynthesisVoiceInstance
});
```

All future TTS instances created will use these settings unless overridden individually.

You can access the underlying `SpeechSynthesisUtterance` if you need low-level control via 
`tts.utterance`

### Creating Multiple TTS instances

```ts
const first = new TTS("This is the first sentence.");
const second = new TTS("And this is the second sentence.");

// Enqueue them; they will play sequentially
TTSManager.enqueue(first);
TTSManager.enqueue(second);
```

## Licence

[Apache License 2.0](LICENSE)
