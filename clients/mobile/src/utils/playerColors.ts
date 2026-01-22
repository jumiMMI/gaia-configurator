
export const PLAYER_COLORS = [
  '#FFD700', 
  '#FF6B6B', 
  '#4ECDC4', 
  '#95E1D3',
] as const;

/**images bordure
 */
export const PLAYER_BORDER_IMAGES = [
  require('../../assets/images/playersStyle/player1-border.png'),
  require('../../assets/images/playersStyle/player1-border.png'), 
  require('../../assets/images/playersStyle/player1-border.png'), 
  require('../../assets/images/playersStyle/player1-border.png'), 
  require('../../assets/images/playersStyle/player1-border.png'), 
  require('../../assets/images/playersStyle/player1-border.png'), 
  require('../../assets/images/playersStyle/player1-border.png'), 
  require('../../assets/images/playersStyle/player1-border.png'), 
] as const;

export function getPlayerColor(playerIndex: number): string {
  const colorIndex = playerIndex % PLAYER_COLORS.length;
  return PLAYER_COLORS[colorIndex];
}

export function getPlayerBorderImage(playerIndex: number) {
  const imageIndex = playerIndex % PLAYER_BORDER_IMAGES.length;
  return PLAYER_BORDER_IMAGES[imageIndex];
}
