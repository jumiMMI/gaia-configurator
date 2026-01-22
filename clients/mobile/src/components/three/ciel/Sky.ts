import { BackSide, Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three";

export default class Sky extends Object3D {
    private _geometry: SphereGeometry;
    private _material: MeshBasicMaterial;
    private _mesh: Mesh;

    constructor() {
        super();
        this._geometry = this._generateGeometry();
        this._material = this._generateMaterial();
        this._mesh = this._generateMesh();
    }

    private _generateGeometry(): SphereGeometry {
        return new SphereGeometry(100, 32, 32);
    }

    private _generateMaterial(): MeshBasicMaterial {
        return new MeshBasicMaterial({
            color: 0x0a0a1a,
            side: BackSide,
        });
    }

    private _generateMesh(): Mesh {
        const mesh = new Mesh(this._geometry, this._material);
        this.add(mesh);
        return mesh;
    }
}
