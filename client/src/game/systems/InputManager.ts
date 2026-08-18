import { ControlAction, ControlBindings, loadControlBindings } from './ControlSettings';

// The existing flight loop consumes these semantic keys. Physical keys may now be remapped
// without requiring any change to movement, weapon, or power-system code.
export interface Keys {
    ArrowUp: boolean;
    ArrowDown: boolean;
    ArrowLeft: boolean;
    ArrowRight: boolean;
    Space: boolean;
}

const ACTION_TO_SEMANTIC_KEY: Record<Exclude<ControlAction, 'tacticalAbility'>, keyof Keys> = {
    moveUp: 'ArrowUp',
    moveDown: 'ArrowDown',
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    fire: 'Space',
};

export class InputManager {
    private readonly bindings: ControlBindings;
    private keys: Keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
    };
    private actionStates: Record<ControlAction, boolean> = {
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        fire: false,
        tacticalAbility: false,
    };

    constructor(bindings: ControlBindings = loadControlBindings()) {
        this.bindings = bindings;
        this.init();
    }

    private init(): void {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private findAction(code: string): ControlAction | undefined {
        return (Object.keys(this.bindings) as ControlAction[]).find((action) => this.bindings[action] === code);
    }

    private setAction(action: ControlAction, active: boolean): void {
        this.actionStates[action] = active;
        if (action !== 'tacticalAbility') this.keys[ACTION_TO_SEMANTIC_KEY[action]] = active;
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        const action = this.findAction(event.code);
        if (!action) return;
        event.preventDefault();
        this.setAction(action, true);
    };

    private handleKeyUp = (event: KeyboardEvent): void => {
        const action = this.findAction(event.code);
        if (!action) return;
        event.preventDefault();
        this.setAction(action, false);
    };

    public getKeys(): Keys {
        return this.keys;
    }

    public isActionPressed(action: ControlAction): boolean {
        return this.actionStates[action];
    }

    public clear(): void {
        for (const action of Object.keys(this.actionStates) as ControlAction[]) this.setAction(action, false);
    }

    public destroy(): void {
        this.clear();
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
