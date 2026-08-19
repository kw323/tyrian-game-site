# Protect The Starship — Android Mobile Design

## Frame and orientation

The Android edition uses a **locked landscape cockpit**. This preserves the combat field, gives the player two natural thumb zones, and keeps boss encounters readable. If a device is held vertically, the game presents a rotate-device prompt instead of a squeezed combat canvas.

## Combat controls

The lower-left quarter of the battle screen holds a large analogue flight stick. It controls both axes and releases to neutral. The lower-right quarter contains a hold-to-fire button, with a smaller tactical-ability button directly above it. These controls live above the canvas, respect display safe areas, and do not cover the central combat lane. The desktop mouse and keyboard paths remain unchanged.

| Area | Control | Gesture | Result |
|---|---|---|---|
| Lower left | Flight stick | Drag and release | Move the starship in two dimensions |
| Lower right | FIRE | Hold | Continuous weapon fire |
| Above FIRE | TACTICAL | Tap | Toggle the equipped tactical ability |
| Upper edge | Pause / return | Tap | Stop active touch input and enter the existing command flow |

## Menus and settings

The title screen becomes a single-column command deck on phones. Primary launch actions remain first, telemetry follows, and archive, systems, and control settings become large full-width touch targets. Small desktop-only helper copy is reduced, while all hit targets remain at least 44 CSS pixels tall. Modal controls use the safe-area insets and scroll within the viewport instead of growing beyond it.

## Automatic save policy

The game writes a resume checkpoint automatically when a mission begins, after a level is completed or the pilot changes major equipment, at a periodic in-flight interval, when the app is backgrounded, and when the player is defeated. The checkpoint preserves stage, score, ship, generator, shield, weapons, pilot skills, and equipment. It never interrupts combat or opens the stage screen. The existing Continue button loads the latest checkpoint.

## Android packaging

The web game is wrapped with Capacitor. The Capacitor Android project receives the built `dist/public` folder, locks activity orientation to landscape, and produces a signed-debuggable APK for direct installation. The app remains fully offline; all story audio and campaign assets are copied into the Android application.
