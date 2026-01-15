import React from "react";

type BiomeIcon = React.ComponentType<any>;

import DesertIcon from '../../assets/2d-icons/desert.svg';
import FieldIcon from '../../assets/2d-icons/Field.svg';
import ForestIcon from '../../assets/2d-icons/Forest.svg';
import IcebergIcon from '../../assets/2d-icons/iceberg.svg';
import MountainIcon from '../../assets/2d-icons/Moutain.svg';
import OceanIcon from '../../assets/2d-icons/ocean.svg';
import VolcanoIcon from '../../assets/2d-icons/Volcano.svg';

export const biomeIcons: Record<string, BiomeIcon> = {
    'Forêt': ForestIcon, 
    'Océan': OceanIcon, 
    'Prairie': FieldIcon, 
    'Désert': DesertIcon, 
    'Volcan': VolcanoIcon, 
    'Glacier': IcebergIcon, 
    'Montagne': MountainIcon, 
};

