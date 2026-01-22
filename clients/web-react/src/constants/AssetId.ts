export const AssetId = {
    THREE_HDR_SPACE: 'THREE_HDR_SPACE',
    THREE_TEXTURE_MOON_ARM: 'THREE_TEXTURE_MOON_ARM',
    THREE_TEXTURE_MOON_NORMAL: 'THREE_TEXTURE_MOON_NORMAL',
} as const;

export type AssetId = (typeof AssetId)[keyof typeof AssetId];
