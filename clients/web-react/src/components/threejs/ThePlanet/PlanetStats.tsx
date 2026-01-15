import { PlanetStatsData } from "@gaia/shared";
import "../../../styles/PlanetStats.css";

interface PlanetStatsProps {
    stats: PlanetStatsData | null;
}

export default function PlanetStats({ stats }: PlanetStatsProps) {
    if (!stats) {
        return (
            <div className="planet-stats-container">
                <p className="planet-stats-loading">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="planet-stats-container">
            <h2 className="planet-stats-title">🌍 État de la Planète</h2>
            
            <div className="planet-stats-section">
                <h3 className="planet-stats-section-title">Environnement</h3>
                <div className="planet-stats-row">
                    <span className="planet-stats-stat">🌡️ {stats.environment.temperature.toFixed(1)}°C</span>
                    <span className="planet-stats-stat">💧 {stats.environment.humidite.toFixed(0)}%</span>
                </div>
                <div className="planet-stats-row">
                    <span className="planet-stats-stat">🏭 CO2: {stats.environment.CO2.toFixed(0)} ppm</span>
                    <span className="planet-stats-stat">☀️ Lum: {stats.environment.lumiere.toFixed(0)}</span>
                </div>
                <p className="planet-stats-score">Score: {stats.environmentScore.global}%</p>
            </div>

            <div className="planet-stats-section">
                <h3 className="planet-stats-section-title">Ressources</h3>
                <div className="planet-stats-row">
                    <span className="planet-stats-stat">🚰 Eau: {stats.resourceScore.eau}%</span>
                    <span className="planet-stats-stat">🍎 Graille: {stats.resourceScore.nourriture}%</span>
                </div>
                <div className="planet-stats-row">
                    <span className="planet-stats-stat">⚡ Énergie: {stats.resourceScore.energie}%</span>
                    <span className="planet-stats-stat">💨 O2: {stats.resourceScore.oxygene}%</span>
                </div>
                <p className="planet-stats-score">Score: {stats.resourceScore.global}%</p>
            </div>

            <div 
                className={`planet-stats-viability ${stats.isViable ? 'viable' : 'not-viable'}`}
            >
                <span className="planet-stats-viability-text">
                    {stats.isViable ? '✅ Planète Viable' : '❌ Non Viable'}
                </span>
            </div>
        </div>
    );
}

