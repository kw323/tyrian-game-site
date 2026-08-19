import { describe, expect, it } from 'vitest';
import {
    DEFAULT_CONTROL_BINDINGS,
    formatControlCode,
    loadFlightControlMode,
    rebindControl,
} from './ControlSettings';

describe('Control settings', () => {
    it('defaults to keyboard flight so pointer movement cannot steer unexpectedly', () => {
        expect(loadFlightControlMode()).toBe('keyboard');
    });

    it('keeps the expected flight defaults', () => {
        expect(DEFAULT_CONTROL_BINDINGS).toMatchObject({
            moveUp: 'ArrowUp',
            moveDown: 'ArrowDown',
            moveLeft: 'ArrowLeft',
            moveRight: 'ArrowRight',
            fire: 'Space',
            tacticalAbility: 'KeyE',
        });
    });

    it('changes one flight action without changing the others', () => {
        const result = rebindControl({ ...DEFAULT_CONTROL_BINDINGS }, 'moveUp', 'KeyW');
        expect(result.error).toBeUndefined();
        expect(result.bindings.moveUp).toBe('KeyW');
        expect(result.bindings.fire).toBe('Space');
    });

    it('rejects duplicate and reserved bindings', () => {
        const duplicate = rebindControl({ ...DEFAULT_CONTROL_BINDINGS }, 'moveUp', 'Space');
        expect(duplicate.error).toContain('already assigned');

        const reserved = rebindControl({ ...DEFAULT_CONTROL_BINDINGS }, 'fire', 'Escape');
        expect(reserved.error).toContain('reserved');
    });

    it('renders readable labels for common control codes', () => {
        expect(formatControlCode('ArrowLeft')).toBe('←');
        expect(formatControlCode('Space')).toBe('SPACE');
        expect(formatControlCode('KeyW')).toBe('W');
    });
});
