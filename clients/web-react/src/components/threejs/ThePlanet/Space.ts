import { Object3D } from "three";
import Moon from "./Moon";
import Sky from "./Sky";
import Stars from "./Stars";

export default class Space extends Object3D {
    private readonly _sky: Sky;
    private readonly _stars: Stars;
    private readonly _moon: Moon;

    constructor(isMoonVisible: boolean = true) {
        super();
        this._sky = new Sky();
        this._stars = new Stars();
        this._moon = new Moon();

        this.add(this._sky);
        this.add(this._stars);
        if (isMoonVisible) {
            this.add(this._moon);
        }
    }

    public update(dt: number) {
        this._stars.update(dt);
        this._moon.update(dt);
    }
}
