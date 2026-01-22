import {
    BufferGeometry,
    Float32BufferAttribute,
    Object3D,
    Points,
    PointsMaterial
} from "three";

export default class Stars extends Object3D {
    private _geometry: BufferGeometry;
    private _material: PointsMaterial;
    private _mesh: Points;

    private static readonly _STAR_COUNT: number = 800;
    private static readonly _STAR_FIELD_RADIUS_MIN: number = 15;
    private static readonly _STAR_FIELD_RADIUS_RANGE: number = 10;

    constructor() {
        super();
        this._geometry = this._generateGeometry();
        this._material = this._generateMaterial();
        this._mesh = this._generateMesh();
    }

    private _generateGeometry(): BufferGeometry {
        const geometry = new BufferGeometry();
        const positions = new Float32Array(Stars._STAR_COUNT * 3);

        for (let i = 0; i < Stars._STAR_COUNT; i++) {

            const phi = Math.acos(-1 + Math.pow(Math.random(), 1.3));
            const theta = Math.random() * 2 * Math.PI;
            const r = Stars._STAR_FIELD_RADIUS_MIN + Math.random() * Stars._STAR_FIELD_RADIUS_RANGE;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
        return geometry;
    }

    private _generateMaterial(): PointsMaterial {
        return new PointsMaterial({
            color: 0xffffff,
            size: 0.08,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
        });
    }

    private _generateMesh(): Points {
        const mesh = new Points(this._geometry, this._material);
        this.add(mesh);
        return mesh;
    }
}
