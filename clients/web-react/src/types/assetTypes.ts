export const AssetType = {
    TEXTURE: 'TEXTURE',
    RGBE: 'RGBE',
    MODEL: 'MODEL',
    FONT: 'FONT',
} as const;

export type AssetType = (typeof AssetType)[keyof typeof AssetType];
