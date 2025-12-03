import { StyleSheet, Text, View } from "react-native";
import { PlanetStatsData } from "../party/messages";

interface PlanetStatsProps {
    stats: PlanetStatsData | null;
}

export default function PlanetStats({ stats }: PlanetStatsProps) {
    if (!stats) {
        return (
            <View style={styles.container}>
                <Text style={styles.loading}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🌍 État de la Planète</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Environnement</Text>
                <View style={styles.row}>
                    <Text style={styles.stat}>🌡️ {stats.environment.temperature.toFixed(1)}°C</Text>
                    <Text style={styles.stat}>💧 {stats.environment.humidite.toFixed(0)}%</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.stat}>🏭 CO2: {stats.environment.CO2.toFixed(0)} ppm</Text>
                    <Text style={styles.stat}>☀️ Lum: {stats.environment.lumiere.toFixed(0)}</Text>
                </View>
                <Text style={styles.score}>Score: {stats.environmentScore.global}%</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ressources</Text>
                <View style={styles.row}>
                    <Text style={styles.stat}>🚰 Eau: {stats.resources.eau}</Text>
                    <Text style={styles.stat}>🍎 Nourr: {stats.resources.nourriture} %</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.stat}>⚡ Énergie: {stats.resources.energie}</Text>
                    <Text style={styles.stat}>💨 O2: {stats.resources.oxygene}</Text>
                </View>
                <Text style={styles.score}>Score: {stats.resourceScore.global}%</Text>
            </View>

            <View style={[styles.viability, { backgroundColor: stats.isViable ? '#22c55e' : '#ef4444' }]}>
                <Text style={styles.viabilityText}>
                    {stats.isViable ? '✅ Planète Viable' : '❌ Non Viable'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        margin: 10,
        minWidth: 220,
    },
    loading: {
        color: '#666',
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: '#333',
    },
    section: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    stat: {
        fontSize: 14,
        color: '#333',
    },
    score: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
        marginTop: 4,
    },
    viability: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    viabilityText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

