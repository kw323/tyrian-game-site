export const CONTROL_BINDINGS_STORAGE_KEY = 'tyrian_control_bindings';

export type ControlAction = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'fire' | 'tacticalAbility';
export type ControlBindings = Record<ControlAction, string>;

export interface ControlDefinition {
    action: ControlAction;
    label: string;
    description: string;
}

export const CONTROL_DEFINITIONS: readonly ControlDefinition[] = [
    { action: 'moveUp', label: 'Move up', description: 'Move the starship upward' },
    { action: 'moveDown', label: 'Move down', description: 'Move the starship downward' },
    { action: 'moveLeft', label: 'Move left', description: 'Move the starship left' },
    { action: 'moveRight', label: 'Move right', description: 'Move the starship right' },
    { action: 'fire', label: 'Fire weapon', description: 'Hold to fire the equipped weapon' },
    { action: 'tacticalAbility', label: 'Tactical ability', description: 'Activate the equipped tactical ability' },
] as const;

export const DEFAULT_CONTROL_BINDINGS: Readonly<ControlBindings> = {
    moveUp: 'ArrowUp',
    moveDown: 'ArrowDown',
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    fire: 'Space',
    tacticalAbility: 'KeyE',
};

const RESERVED_CODES = new Set([
    'Escape', 'Enter', 'Tab',
    'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6',
    'KeyL', 'KeyM',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isUsableCode(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && !RESERVED_CODES.has(value);
}

export function loadControlBindings(): ControlBindings {
    const fallback = { ...DEFAULT_CONTROL_BINDINGS };
    if (typeof window === 'undefined') return fallback;

    try {
        const raw = window.localStorage.getItem(CONTROL_BINDINGS_STORAGE_KEY);
        if (!raw) return fallback;
        const stored = JSON.parse(raw) as unknown;
        if (!isRecord(stored)) return fallback;

        const candidate = { ...fallback };
        for (const { action } of CONTROL_DEFINITIONS) {
            if (isUsableCode(stored[action])) candidate[action] = stored[action];
        }

        return new Set(Object.values(candidate)).size === CONTROL_DEFINITIONS.length ? candidate : fallback;
    } catch {
        return fallback;
    }
}

export function saveControlBindings(bindings: ControlBindings): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CONTROL_BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
}

export function resetControlBindings(): ControlBindings {
    const defaults = { ...DEFAULT_CONTROL_BINDINGS };
    saveControlBindings(defaults);
    return defaults;
}

export function rebindControl(bindings: ControlBindings, action: ControlAction, code: string): { bindings: ControlBindings; error?: string } {
    if (!isUsableCode(code)) {
        return { bindings, error: 'That key is reserved for navigation, weapon selection, or testing.' };
    }

    const occupiedBy = CONTROL_DEFINITIONS.find((definition) => definition.action !== action && bindings[definition.action] === code);
    if (occupiedBy) {
        return { bindings, error: `${formatControlCode(code)} is already assigned to ${occupiedBy.label}.` };
    }

    const next = { ...bindings, [action]: code };
    saveControlBindings(next);
    return { bindings: next };
}

export function formatControlCode(code: string): string {
    const labels: Record<string, string> = {
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
        Space: 'SPACE',
        ShiftLeft: 'LEFT SHIFT',
        ShiftRight: 'RIGHT SHIFT',
        ControlLeft: 'LEFT CTRL',
        ControlRight: 'RIGHT CTRL',
        AltLeft: 'LEFT ALT',
        AltRight: 'RIGHT ALT',
    };
    if (labels[code]) return labels[code];
    if (code.startsWith('Key')) return code.slice(3).toUpperCase();
    if (code.startsWith('Digit')) return code.slice(5);
    return code.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}
