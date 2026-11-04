import assert from "node:assert/strict";
import test from "node:test";
import { MUSIC_BASS, MUSIC_LEAD, noteFrequency } from "../app/audio.ts";
import { EXCLAMATIONS, pickExclamation, voiceScore } from "../app/speech.ts";

test("notes: A4 is 440 Hz, octaves double, sharps sit a semitone up", () => {
  assert.equal(noteFrequency("A4"), 440);
  assert.ok(Math.abs(noteFrequency("C5") - 523.25) < 0.01);
  assert.ok(Math.abs(noteFrequency("A5") / noteFrequency("A4") - 2) < 1e-9);
  assert.ok(Math.abs(noteFrequency("F#4") / noteFrequency("F4") - 2 ** (1 / 12)) < 1e-9);
  assert.throws(() => noteFrequency("H4"));
});

test("music: every note is playable and the bass lines up with the melody", () => {
  assert.equal(MUSIC_LEAD.length % 8, 0, "melody fills whole bars");
  assert.equal(MUSIC_BASS.length * 2, MUSIC_LEAD.length, "one bass note per two melody steps");
  assert.notEqual(MUSIC_LEAD[0], "-", "the loop starts on a note, not a hold");
  for (const note of [...MUSIC_LEAD, ...MUSIC_BASS]) if (note !== "-") assert.ok(noteFrequency(note) > 0, note);
});

test("voices: natural-sounding voices beat robotic ones, accent breaks ties", () => {
  const v = (name, lang, localService = true) => voiceScore({ name, lang, localService });
  assert.ok(v("Microsoft Sonia Online (Natural) - English (United Kingdom)", "en-GB", false) > v("Microsoft Heera - English (India)", "en-IN"));
  assert.ok(v("Google UK English Female", "en-GB", false) > v("Microsoft David - English (United States)", "en-US"));
  assert.ok(v("Microsoft Neerja Online (Natural) - English (India)", "en-IN", false) > v("Microsoft Sonia Online (Natural) - English (United Kingdom)", "en-GB", false));
  assert.ok(v("Samantha (Enhanced)", "en-US") > v("eSpeak English", "en"));
  assert.ok(v("Google Deutsch", "de-DE", false) < 0, "non-English voices are never chosen");
});

test("exclamations: never repeat the praise's own first word", () => {
  for (const kind of /** @type {const} */ (["cheer", "oops"])) {
    for (let i = 0; i < 20; i++) {
      const word = pickExclamation(kind, "Wow! You got it!", () => i / 20);
      assert.ok(EXCLAMATIONS[kind].includes(word));
      assert.notEqual(word, "Wow!");
    }
  }
  assert.notEqual(pickExclamation("oops", "Oops, try again", () => 0), "Oops!");
});
