import {
    CylinderGeometry,
    Group,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    Vector2
} from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";

const BIOME_COLORS = [
    0x228B22, // Forêt - vert
    0x3b82f6, // Océan - bleu
    0x90EE90, // Prairie - vert clair
    0xEDC9AF, // Désert - sable
    0x8B0000, // Volcan - rouge foncé
    0xADD8E6, // Glacier - bleu clair
    0x808080, // Montagne - gris
];

export default class HexGrid extends Object3D {
    private _hexRadius: number = 0.5;
    private _hexHeight: number = 0.15;
    private _cols: number = 4;
    private _rows: number = 7;
    
    private _hexagons: Group[] = [];
    private _horizSpacing: number;
    private _gridWidth: number;
    private _leftLimit: number;
    private _rightLimit: number;
    private _fadeOutStart: number;
    private _fadeInEnd: number;

    constructor() {
        super();
        

        this._horizSpacing = Math.sqrt(3) * this._hexRadius;
        this._gridWidth = this._cols * this._horizSpacing;
        

        const halfWidth = this._gridWidth / 2;
        this._leftLimit = -halfWidth;
        this._rightLimit = halfWidth;
        

        const fadeOutZone = halfWidth * 0.7;
        const fadeInZone = halfWidth * 0.45;
        this._fadeOutStart = this._leftLimit + fadeOutZone;
        this._fadeInEnd = this._rightLimit - fadeInZone;
        
        this._createGrid();
    }

    update(speed: number): void {
        for (const group of this._hexagons) {
            group.position.x -= speed;
            
            const { meshMaterial, lineMaterial } = group.userData;
            let opacity = 1;

            if (group.position.x < this._fadeOutStart) {
                opacity = (group.position.x - this._leftLimit) / (this._fadeOutStart - this._leftLimit);
                opacity = Math.max(0, Math.min(1, opacity));
                opacity = Math.pow(opacity, 2);
            } else if (group.position.x > this._fadeInEnd) {
                opacity = 1 - (group.position.x - this._fadeInEnd) / (this._rightLimit - this._fadeInEnd);
                opacity = Math.max(0, Math.min(1, opacity));
                opacity = Math.pow(opacity, 2);
            }

            meshMaterial.opacity = opacity;
            lineMaterial.opacity = opacity;

            if (group.position.x < this._leftLimit) {
                group.position.x += this._gridWidth;
                
                const newColor = BIOME_COLORS[Math.floor(Math.random() * BIOME_COLORS.length)];
                meshMaterial.color.setHex(newColor);
                meshMaterial.emissive.setHex(newColor);
                lineMaterial.color.setHex(newColor);
                group.userData.color = newColor;
            }
        }
    }


    private _tileToPosition(col: number, row: number): Vector2 {
        const horizSpacing = Math.sqrt(3) * this._hexRadius;
        const vertSpacing = 1.5 * this._hexRadius;        

        const x = (col + (row % 2) * 0.5) * horizSpacing;
        const z = row * vertSpacing;

        return new Vector2(x, z);
    }


    private _createHexagon(position: Vector2): Group {
        const group = new Group();
        
        const geometry = new CylinderGeometry(
            this._hexRadius,
            this._hexRadius,
            this._hexHeight,
            6,
            1
        );

        const randomColor = BIOME_COLORS[Math.floor(Math.random() * BIOME_COLORS.length)];

        // Mesh
        const material = new MeshStandardMaterial({
            color: randomColor,
            emissive: randomColor,
            emissiveIntensity: 0,
            flatShading: true,
            transparent: true,
            opacity: 1,
        });

        const hexMesh = new Mesh(geometry, material);
        group.add(hexMesh);


        const linePoints: number[] = [];
        const topY = this._hexHeight / 2 + 0.01;
        const angleOffset = Math.PI / 6;
        const lineRadius = this._hexRadius * 0.95;
        
        for (let i = 0; i <= 6; i++) {
            const angle = (i % 6) * (Math.PI / 3) + angleOffset;
            const x = Math.cos(angle) * lineRadius;
            const z = Math.sin(angle) * lineRadius;
            linePoints.push(x, topY, z);
        }

        const lineGeometry = new LineGeometry();
        lineGeometry.setPositions(linePoints);

        const lineMaterial = new LineMaterial({
            color: randomColor,
            linewidth: 3,
            transparent: true,
            opacity: 1,
        });
        lineMaterial.resolution.set(1080, 1920);

        const line = new Line2(lineGeometry, lineMaterial);
        group.add(line);

        group.position.set(position.x, 0, position.y);
        group.userData = { color: randomColor, mesh: hexMesh, line, lineMaterial, meshMaterial: material, baseColor: randomColor };

        return group;
    }


    private _createGrid(): void {
        const centerCol = (this._cols - 1) / 2;
        const centerRow = (this._rows - 1) / 2;
        const centerPos = this._tileToPosition(centerCol, centerRow);

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const position = this._tileToPosition(col, row);
                
                position.x -= centerPos.x;
                position.y -= centerPos.y;

                const hexagon = this._createHexagon(position);
                this._hexagons.push(hexagon);
                this.add(hexagon);
            }
        }
    }
}
