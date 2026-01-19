import { BufferGeometry, Float32BufferAttribute, Object3D, Points, ShaderMaterial } from "three";
import StarsFragmentShader from "../../../shaders/stars/StarsFragmentShader.glsl";
import StarsVertexShader from "../../../shaders/stars/StarsVertexShader.glsl";

export default class Stars extends Object3D {
    private declare _geometry: BufferGeometry;
    private declare _material: ShaderMaterial;
    private declare _mesh: Points;

    //#region Constants
    //
    private static readonly _STAR_COUNT: number = 10000;
    private static readonly _STAR_FIELD_RADIUS_MIN: number = 75;
    private static readonly _STAR_FIELD_RADIUS_RANGE: number = 24.5;
    private static readonly _RANDOM_SCALE_RANGE: number = 3.5;
    private static readonly _RANDOM_BRIGHTNESS_MIN: number = 1.0;
    private static readonly _RANDOM_BRIGHTNESS_RANGE: number = 0.5;
    private static readonly _RANDOM_TIME_OFFSET_RANGE: number = 1000;
    private static readonly _POINT_SIZE: number = 1;
    //
    //#endregion

    constructor() {
        super();

        this._generateGeometry();
        this._generateMaterial();
        this._generateMesh();
    }

    private _generateGeometry(): void {
        this._geometry = new BufferGeometry();
        const positions: Float32Array = new Float32Array(Stars._STAR_COUNT * 3);
        const randomScale = new Float32Array(Stars._STAR_COUNT);
        const randomBrightness = new Float32Array(Stars._STAR_COUNT);
        const randomTimeOffset = new Float32Array(Stars._STAR_COUNT);

        for (let i = 0; i < Stars._STAR_COUNT; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * 2 * Math.PI;
            const r = Stars._STAR_FIELD_RADIUS_MIN + Math.random() * Stars._STAR_FIELD_RADIUS_RANGE;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            randomScale[i] = Math.random() * Stars._RANDOM_SCALE_RANGE;
            randomBrightness[i] = Stars._RANDOM_BRIGHTNESS_MIN + Math.random() * Stars._RANDOM_BRIGHTNESS_RANGE;
            randomTimeOffset[i] = Math.random() * Stars._RANDOM_TIME_OFFSET_RANGE;
        }

        this._geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
        this._geometry.setAttribute("randomScale", new Float32BufferAttribute(randomScale, 1));
        this._geometry.setAttribute("randomBrightness", new Float32BufferAttribute(randomBrightness, 1));
        this._geometry.setAttribute("randomTimeOffset", new Float32BufferAttribute(randomTimeOffset, 1));
    }

    private _generateMaterial(): void {
        this._material = new ShaderMaterial({
            vertexShader: StarsVertexShader,
            fragmentShader: StarsFragmentShader,
            uniforms: {
                pointSize: { value: Stars._POINT_SIZE },
                uTime: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false,
        });
    }

    private _generateMesh(): void {
        this._mesh = new Points(this._geometry, this._material);
        this.add(this._mesh);
    }

    public update(dt: number): void {
        this._material.uniforms.uTime.value += dt;
    }
}
