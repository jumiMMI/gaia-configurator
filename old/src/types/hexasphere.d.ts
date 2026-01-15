declare module 'hexasphere.js' {
    interface Tile {
        centerPoint: {
            x: string | number;
            y: string | number;
            z: string | number;
        };
        boundary: Array<{
            x: string | number;
            y: string | number;
            z: string | number;
        }>;
        neighbors: Tile[];
        neighborIds: string[];
        toJson(): any;
    }

    class Hexasphere {
        constructor(radius: number, numDivisions: number, hexSize: number);
        radius: number;
        tiles: Tile[];
        tileLookup: { [key: string]: Tile };
        toJson(): string;
        toObj(): string;
    }

    export = Hexasphere;
}

