import { PerspectiveCamera, Vector3 } from "three";

const CAMERA_HOME = new Vector3(0, 2, 4.3);
const CAMERA_SCANNER = new Vector3(0, 0.8, 2.3);

const LOOKAT_HOME = new Vector3(0, 0, 0);
const LOOKAT_SCANNER = new Vector3(0, 0.5, 0);

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export type CameraMode = "home" | "scanner";

export default class Camera extends PerspectiveCamera {
    private _targetPosition: Vector3 = CAMERA_HOME.clone();
    private _startPosition: Vector3 = CAMERA_HOME.clone();
    private _targetLookAt: Vector3 = LOOKAT_HOME.clone();
    private _startLookAt: Vector3 = LOOKAT_HOME.clone();
    private _currentLookAt: Vector3 = LOOKAT_HOME.clone();
    
    private _animationProgressY: number = 1;
    private _animationProgressZ: number = 1;
    
    private _speedY: number = 0.025;
    private _speedZ: number = 0.008;

    constructor(aspect: number) {
        super(45, aspect, 0.1, 1000);
        this.position.copy(CAMERA_HOME);
        this.lookAt(LOOKAT_HOME);
    }

    setMode(mode: CameraMode): void {
        this._startPosition.copy(this.position);
        this._startLookAt.copy(this._currentLookAt);
        
        if (mode === "scanner") {
            this._targetPosition.copy(CAMERA_SCANNER);
            this._targetLookAt.copy(LOOKAT_SCANNER);
            this._speedY = 0.025;
            this._speedZ = 0.008;
        } else {
            this._targetPosition.copy(CAMERA_HOME);
            this._targetLookAt.copy(LOOKAT_HOME);
            this._speedY = 0.012;
            this._speedZ = 0.015;
        }
        
        this._animationProgressY = 0;
        this._animationProgressZ = 0;
    }

    update(): void {
        const isAnimatingY = this._animationProgressY < 1;
        const isAnimatingZ = this._animationProgressZ < 1;

        if (!isAnimatingY && !isAnimatingZ) return;

        if (isAnimatingY) {
            this._animationProgressY += this._speedY;
            if (this._animationProgressY > 1) this._animationProgressY = 1;
        }
        
        if (isAnimatingZ) {
            this._animationProgressZ += this._speedZ;
            if (this._animationProgressZ > 1) this._animationProgressZ = 1;
        }

        const tY = easeOutCubic(this._animationProgressY);
        const tZ = easeOutCubic(this._animationProgressZ);
        
        this.position.y = this._startPosition.y + (this._targetPosition.y - this._startPosition.y) * tY;
        this.position.z = this._startPosition.z + (this._targetPosition.z - this._startPosition.z) * tZ;
        
        this._currentLookAt.lerpVectors(this._startLookAt, this._targetLookAt, tY);
        this.lookAt(this._currentLookAt);
    }

    get isAnimating(): boolean {
        return this._animationProgressY < 1 || this._animationProgressZ < 1;
    }
}
