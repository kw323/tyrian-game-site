# Story integration validation

The main page renders the Ark-9 / Program Zero briefing with Dr. Naomi Ren's portrait and the expected introductory copy. Starting the game renders a compact COMMS panel in the canvas at the top right, including Naomi's portrait, speaker label, and a wrapped transmission. The game canvas remains playable and the existing HUD remains visible. The portrait asset URL resolves through Manus storage.

The shop briefing row was moved above the two cards so the contact portrait cannot overlap the card borders. The TypeScript/Vite build passes after this layout correction.
