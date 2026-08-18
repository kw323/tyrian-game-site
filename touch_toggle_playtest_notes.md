# Touch Controls toggle verification

The launch rail now includes `TOUCH CONTROLS: ON/OFF`. The preference is persisted in `localStorage` under `tyrian_touch_controls_enabled`, defaults to enabled on narrow screens and disabled on wide screens, and updates the launch status and input readout immediately.

`GameContainer` receives the preference. The mobile overlay is rendered only when the viewport is mobile and the preference is ON. Turning it OFF also clears joystick axes and the FIRE latch so no movement or shooting can continue after hiding the controls.

Visual checks:
- Desktop 1280x720 full-page preview: touch layer is absent, the button reads `TOUCH CONTROLS: OFF`, and the input line reads `TOUCH HIDDEN`.
- Mobile 375x812 full-page preview: the toggle is visible in the action rail and the rest of the page remains responsive. The mobile touch layer is correctly gated by the saved preference.

Build checks:
- `pnpm exec tsc --noEmit` passed.
- `pnpm run build` passed.
