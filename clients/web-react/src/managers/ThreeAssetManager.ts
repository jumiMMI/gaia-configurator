import { Action, AssetUtils } from '@benjos/cookware';
import {
    DataTexture,
    EquirectangularRefractionMapping,
    LinearSRGBColorSpace,
    RepeatWrapping,
    Texture,
    TextureLoader,
    type ColorSpace,
    type Mapping,
    type Wrapping,
} from 'three';
import { DRACOLoader, Font, FontLoader, GLTFLoader, RGBELoader, type GLTF } from 'three/examples/jsm/Addons.js';
import type { AssetId } from '../constants/AssetId';
import { AssetType } from '../types/assetTypes';

export interface ThreeAssetToLoad {
    id: AssetId;
    type: AssetType;
    path: string;
    option?: ThreeAssetOption;
    loadedSize: number;
    totalSize: number;
}

export interface ThreeAssetOption { }

export interface ThreeTextureOption extends ThreeAssetOption {
    colorSpace?: ColorSpace;
    wrapping?: Wrapping;
    repeatX?: number;
    repeatY?: number;
    centerX?: number;
    centerY?: number;
}

export interface ThreeRGBEOption extends ThreeAssetOption {
    mapping?: Mapping;
    colorSpace?: ColorSpace;
}

export interface ThreeModelOption extends ThreeAssetOption { }

export interface ThreeFontOption extends ThreeAssetOption { }

class ThreeAssetsManager {
    private static readonly _DRACO_LOADER_PATH: string = 'loaders/draco/';
    private static readonly _DEFAULT_TEXTURE_OPTION_COLOR_SPACE: ColorSpace = LinearSRGBColorSpace;
    private static readonly _DEFAULT_TEXTURE_OPTION_WRAPPING: Wrapping = RepeatWrapping;
    private static readonly _DEFAULT_TEXTURE_OPTION_REPEAT_X: number = 1;
    private static readonly _DEFAULT_TEXTURE_OPTION_REPEAT_Y: number = 1;
    private static readonly _DEFAULT_TEXTURE_OPTION_CENTER_X: number = 0.5;
    private static readonly _DEFAULT_TEXTURE_OPTION_CENTER_Y: number = 0.5;
    private static readonly _DEFAULT_RGBE_MAPPING: Mapping = EquirectangularRefractionMapping;
    private static readonly _DEFAULT_RGBE_COLOR_SPACE: ColorSpace = LinearSRGBColorSpace;
    private static readonly _DEFAULT_LOADED_SIZE: number = 0;
    private static readonly _DEFAULT_TOTAL_SIZE: number = -1;
    private static readonly _DEFAULT_TEXTURE_TOTAL_SIZE: number = 1;

    private readonly _assets: Map<string, Texture | DataTexture | GLTF | Font> = new Map<
        string,
        Texture | GLTF | Font
    >();
    private readonly _toLoadList: ThreeAssetToLoad[] = [];
    private _expectedAssetsCount = 0;

    private readonly _textureLoader = new TextureLoader();
    private readonly _rgbeLoader = new RGBELoader();
    private readonly _gltfLoader = new GLTFLoader();
    private readonly _dracoLoader = new DRACOLoader();
    private readonly _fontLoader = new FontLoader();

    public readonly onLoad = new Action();
    public readonly onProgress = new Action();
    public readonly onFinishLoad = new Action();

    public init(): void {
        this._dracoLoader.setDecoderPath(AssetUtils.GetPath(ThreeAssetsManager._DRACO_LOADER_PATH));
        this._gltfLoader.setDRACOLoader(this._dracoLoader);
    }

    public addTexture(id: AssetId, path: string, textureOption?: ThreeTextureOption): void {
        this._toLoadList.push({
            id,
            type: AssetType.TEXTURE,
            path,
            option: textureOption,
            loadedSize: ThreeAssetsManager._DEFAULT_LOADED_SIZE,
            totalSize: ThreeAssetsManager._DEFAULT_TEXTURE_TOTAL_SIZE,
        });
        this._expectedAssetsCount++;
    }

    public addRGBE(id: AssetId, path: string, rgbeOption?: ThreeRGBEOption): void {
        this._toLoadList.push({
            id,
            type: AssetType.RGBE,
            path,
            option: rgbeOption,
            loadedSize: ThreeAssetsManager._DEFAULT_LOADED_SIZE,
            totalSize: ThreeAssetsManager._DEFAULT_TOTAL_SIZE,
        });
        this._expectedAssetsCount++;
    }

    public addModel(id: AssetId, path: string, modelOption?: ThreeModelOption): void {
        this._toLoadList.push({
            id,
            type: AssetType.MODEL,
            path,
            option: modelOption,
            loadedSize: ThreeAssetsManager._DEFAULT_LOADED_SIZE,
            totalSize: ThreeAssetsManager._DEFAULT_TOTAL_SIZE,
        });
        this._expectedAssetsCount++;
    }

    public addFont(id: AssetId, path: string, fontOption?: ThreeFontOption): void {
        this._toLoadList.push({
            id,
            type: AssetType.FONT,
            path,
            option: fontOption,
            loadedSize: ThreeAssetsManager._DEFAULT_LOADED_SIZE,
            totalSize: ThreeAssetsManager._DEFAULT_TOTAL_SIZE,
        });
        this._expectedAssetsCount++;
    }

    public beginLoad(): void {
        if (this._toLoadList.length === 0) {
            this.onLoad.execute();
            return;
        }
        for (const asset of this._toLoadList) {
            if (asset.type === AssetType.TEXTURE) this._loadTexture(asset);
            else if (asset.type === AssetType.RGBE) this._loadRGBE(asset);
            else if (asset.type === AssetType.MODEL) this._loadModel(asset);
            else if (asset.type === AssetType.FONT) this._loadFont(asset);
        }
    }

    public finishLoad(): void {
        this._toLoadList.length = 0;
    }

    private _loadTexture(asset: ThreeAssetToLoad): void {
        const option = asset.option as ThreeTextureOption | undefined;
        this._textureLoader.load(
            asset.path,
            (texture) => {
                texture.colorSpace = option?.colorSpace ?? ThreeAssetsManager._DEFAULT_TEXTURE_OPTION_COLOR_SPACE;
                texture.wrapS = texture.wrapT = option?.wrapping ?? ThreeAssetsManager._DEFAULT_TEXTURE_OPTION_WRAPPING;
                texture.repeat.set(
                    option?.repeatX ?? ThreeAssetsManager._DEFAULT_TEXTURE_OPTION_REPEAT_X,
                    option?.repeatY ?? ThreeAssetsManager._DEFAULT_TEXTURE_OPTION_REPEAT_Y
                );
                texture.center.set(
                    option?.centerX ?? ThreeAssetsManager._DEFAULT_TEXTURE_OPTION_CENTER_X,
                    option?.centerY ?? ThreeAssetsManager._DEFAULT_TEXTURE_OPTION_CENTER_Y
                );
                asset.loadedSize = asset.totalSize;
                this._onLoad(asset.id, texture);
            },
            (event: ProgressEvent) => this._onProgress(asset, event),
            () => this._onError(AssetType.TEXTURE, asset.id, asset.path)
        );
    }

    private _loadRGBE(asset: ThreeAssetToLoad): void {
        const option = asset.option as ThreeRGBEOption | undefined;
        this._rgbeLoader.load(
            asset.path,
            (dataTexture) => {
                dataTexture.mapping = option?.mapping ?? ThreeAssetsManager._DEFAULT_RGBE_MAPPING;
                dataTexture.colorSpace = option?.colorSpace ?? ThreeAssetsManager._DEFAULT_RGBE_COLOR_SPACE;
                this._onLoad(asset.id, dataTexture);
            },
            (event: ProgressEvent) => this._onProgress(asset, event),
            () => this._onError(AssetType.RGBE, asset.id, asset.path)
        );
    }

    private _loadModel(asset: ThreeAssetToLoad): void {
        this._gltfLoader.load(
            asset.path,
            (model) => this._onLoad(asset.id, model),
            (event: ProgressEvent) => this._onProgress(asset, event),
            () => this._onError(AssetType.MODEL, asset.id, asset.path)
        );
    }

    private _loadFont(asset: ThreeAssetToLoad): void {
        this._fontLoader.load(
            asset.path,
            (font) => this._onLoad(asset.id, font),
            (event: ProgressEvent) => this._onProgress(asset, event),
            () => this._onError(AssetType.FONT, asset.id, asset.path)
        );
    }

    private _onLoad(id: AssetId, asset: Texture | GLTF | Font): void {
        this._assets.set(id, asset);
        this.onLoad.execute();
        if (this.isLoaded) {
            this.onFinishLoad.execute();
        }
    }

    private _onProgress(asset: ThreeAssetToLoad, event: ProgressEvent): void {
        if (asset.totalSize === ThreeAssetsManager._DEFAULT_TOTAL_SIZE) asset.totalSize = event.total;
        asset.loadedSize = event.loaded;
        this.onProgress.execute();
    }

    private _onError(type: AssetType, id: AssetId, path: string): void {
        throw new Error(`ThreeAssetsManager: Failed to load ${type} with id '${id}' from path '${path}'`);
    }

    public getTexture(id: AssetId): Texture {
        const asset = this._assets.get(id);
        if (!asset) throw new Error(`Texture with id '${id}' not found!`);
        return asset as Texture;
    }

    public getRGBE(id: AssetId): DataTexture {
        const asset = this._assets.get(id);
        if (!asset) throw new Error(`RGBE with id '${id}' not found!`);
        return asset as DataTexture;
    }

    public getModel(id: AssetId): GLTF {
        const asset = this._assets.get(id);
        if (!asset) throw new Error(`Model with id '${id}' not found!`);
        return asset as GLTF;
    }

    public getFont(id: AssetId): Font {
        const asset = this._assets.get(id);
        if (!asset) throw new Error(`Font with id '${id}' not found!`);
        return asset as Font;
    }

    //#region Getters
    //
    public get isLoaded(): boolean {
        return this._assets.size === this._expectedAssetsCount;
    }
    public get totalSize(): number {
        let totalSize = 0;
        for (const asset of this._toLoadList) {
            totalSize += asset.totalSize;
        }
        return totalSize;
    }
    public get loadedSize(): number {
        let loadedSize = 0;
        for (const asset of this._toLoadList) {
            loadedSize += asset.loadedSize;
        }
        return loadedSize;
    }
    //
    //#endregion
}

export default new ThreeAssetsManager();
