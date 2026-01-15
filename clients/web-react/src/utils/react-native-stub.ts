// Stub pour react-native dans l'environnement web
// Ce fichier remplace react-native qui n'est pas compatible avec Vite/web

export const Platform = {
  OS: 'web',
  select: (obj: any) => obj.web || obj.default,
};

export default {};

