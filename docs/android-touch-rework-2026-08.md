# Android Touch Rework — Protect The Starship

## Fullscreen battle

The Android activity runs in immersive landscape. The game canvas becomes the only visible surface while a mission is active; the desktop header, footer, status rail, and outer frame are removed. The canvas scales to the device height with a small safe-area margin.

## Direct flight input

The virtual joystick is removed on Android. Touching and dragging anywhere in the central battle field places a live target for the ship. The ship glides toward the finger rather than moving on a fixed directional button. Releasing the finger keeps the ship at its last position. The final right-side control zone contains only a compact hold-to-fire button and a compact tactical button, clear of the central flight lane.

## Android mission controls

The canvas menus remain the source of campaign information, but Android receives a persistent HTML command strip with large touch targets. It advances the ready room and dialogue pages, opens the mission map, and returns safely to the title. This gives the player an accessible primary action without requiring tiny desktop canvas hitboxes.

## Dialogue and voice

A dialogue page is always entered through a real touch gesture from the Android command strip. This satisfies Android WebView audio-gesture rules before playback begins. Dialogue text remains visible in the game surface, while the command strip provides a large NEXT / START MISSION action. Voice-over is explicitly warmed up on the first Android launch gesture and falls back to the current subtitle if a single line is unavailable.
