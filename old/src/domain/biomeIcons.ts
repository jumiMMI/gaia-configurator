/**
 * Fichier séparé pour les icônes des biomes
 * Ce fichier n'est importé QUE côté client pour éviter les erreurs esbuild côté serveur
 */
import { ImageSourcePropType } from "react-native";

export const biomeIcons: Record<string, ImageSourcePropType> = {
    'Forêt': require('../../assets/2d-icons/Forest.png'),
    'Océan': require('../../assets/2d-icons/ocean.png'),
    'Prairie': require('../../assets/2d-icons/Field.png'),
    'Désert': require('../../assets/2d-icons/Grand Canyon.png'),
    'Volcan': require('../../assets/2d-icons/Volcano.png'),
    'Glacier': require('../../assets/2d-icons/Iceberg.png'),
    'Montagne': require('../../assets/2d-icons/Mountain.png'),
};

