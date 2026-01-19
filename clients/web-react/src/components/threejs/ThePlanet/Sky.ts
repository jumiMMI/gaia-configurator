import { BackSide, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from "three";

export default class Sky extends Object3D {
    private declare _geometry: SphereGeometry;
    private declare _material: MeshStandardMaterial;
    private declare _mesh: Mesh;

    constructor() {
        super();
        this._generateGeometry();
        this._generateMaterial();
        this._generateMesh();
    }

    private _generateGeometry(): void {
        this._geometry = new SphereGeometry(100, 64, 64);
    }

    private _generateMaterial(): void {
        this._material = new MeshStandardMaterial({
            color: 0x0F0F0F,
            metalness: 0,
            roughness: 1,
            side: BackSide,
        });
    }

    private _generateMesh(): void {
        this._mesh = new Mesh(this._geometry, this._material);
        this.add(this._mesh);
    }
}
