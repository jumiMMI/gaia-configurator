import { AssetId } from "@/constants/AssetId";
import ThreeAssetManager from "@/managers/ThreeAssetManager";
import { Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from "three";

export default class Moon extends Object3D {
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
        this._geometry = new SphereGeometry(0.5, 32, 32);
    }

    private _generateMaterial(): void {
        this._material = new MeshStandardMaterial({
            color: 0xFFFFFF,
            metalness: 0,
            roughness: 1,
            normalMap: ThreeAssetManager.getTexture(AssetId.THREE_TEXTURE_MOON_NORMAL),
            aoMap: ThreeAssetManager.getTexture(AssetId.THREE_TEXTURE_MOON_ARM),
            roughnessMap: ThreeAssetManager.getTexture(AssetId.THREE_TEXTURE_MOON_ARM),
            metalnessMap: ThreeAssetManager.getTexture(AssetId.THREE_TEXTURE_MOON_ARM),
        });
    }

    private _generateMesh(): void {
        this._mesh = new Mesh(this._geometry, this._material);
        this._mesh.position.set(5, 2.5, 0);
        this.add(this._mesh);
    }

    public update(dt: number) {
        this._mesh.rotation.y += dt * 0.1;
        this.rotation.y += dt * 0.05;
    }
}
