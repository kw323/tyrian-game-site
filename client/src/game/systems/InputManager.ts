export interface Keys {
    ArrowUp: boolean;
    ArrowDown: boolean;
    ArrowLeft: boolean;
    ArrowRight: boolean;
    Space: boolean;
}

export class InputManager {
    private keys: Keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
    };

    constructor() {
        this.init();
    }

    private init(): void {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === ' ') {
            e.preventDefault();
            this.keys.Space = true;
        } else if (e.key in this.keys) {
            e.preventDefault();
            this.keys[e.key as keyof Keys] = true;
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (e.key === ' ') {
            e.preventDefault();
            this.keys.Space = false;
        } else if (e.key in this.keys) {
            e.preventDefault();
            this.keys[e.key as keyof Keys] = false;
        }
    }

    public getKeys(): Keys {
        return this.keys;
    }

    public isKeyPressed(key: keyof Keys): boolean {
        return this.keys[key] || false;
    }
}
