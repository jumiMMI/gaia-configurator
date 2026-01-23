
export const PLAYER_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#95E1D3',
] as const;

/**images bordure
 */
export const PLAYER_BORDER_IMAGES = [
  require('../../assets/images/playersStyle/border-1.png'),
  require('../../assets/images/playersStyle/border-2.png'),
  require('../../assets/images/playersStyle/border-3.png'),
  require('../../assets/images/playersStyle/border-4.png'),
] as const;

export const PLAYER_ENDGAME_IMAGES = [
  require('../../assets/images/playersStyle/endgame-1.png'),
  require('../../assets/images/playersStyle/endgame-2.png'),
  require('../../assets/images/playersStyle/endgame-3.png'),
  require('../../assets/images/playersStyle/endgame-4.png'),
] as const;

export function getPlayerColor(playerIndex: number): string {
  const colorIndex = playerIndex % PLAYER_COLORS.length;
  return PLAYER_COLORS[colorIndex];
}

export function getPlayerBorderImage(playerIndex: number) {
  const imageIndex = playerIndex % PLAYER_BORDER_IMAGES.length;
  return PLAYER_BORDER_IMAGES[imageIndex];
}

export function getPlayerEndgameImage(playerIndex: number) {
  const imageIndex = playerIndex % PLAYER_ENDGAME_IMAGES.length;
  return PLAYER_ENDGAME_IMAGES[imageIndex];
}
