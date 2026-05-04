import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { styles } from '../utils/styles';

export default function PreferencesScreen() {
  const { user, logout, preferences, updatePreferences } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferências</Text>

      <Card title="Usuário">
        <Text style={styles.text}>{user?.name}</Text>
        <Text style={styles.muted}>{user?.email}</Text>
        <Text style={styles.muted}>Perfil: {user?.role}</Text>
      </Card>

      <Card title="Unidade de temperatura">
        <View style={[styles.row, { justifyContent: 'flex-start' }]}>
          <TouchableOpacity style={[styles.smallButton, preferences.unit === 'C' && styles.smallButtonActive]} onPress={() => updatePreferences({ unit: 'C' })}>
            <Text style={styles.text}>°C</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallButton, preferences.unit === 'F' && styles.smallButtonActive]} onPress={() => updatePreferences({ unit: 'F' })}>
            <Text style={styles.text}>°F</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card title="Intervalo de atualização">
        <View style={[styles.row, { justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
          {[5000, 15000, 30000, 60000].map((value) => (
            <TouchableOpacity key={value} style={[styles.smallButton, preferences.refreshInterval === value && styles.smallButtonActive]} onPress={() => updatePreferences({ refreshInterval: value })}>
              <Text style={styles.text}>{value / 1000}s</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card title="Favoritos">
        <Text style={styles.muted}>Ambientes favoritos: {preferences.favoriteEnvironmentIds.length}</Text>
        <Text style={styles.muted}>Use a tela de detalhes do ambiente para favoritar.</Text>
      </Card>

      <TouchableOpacity style={styles.buttonDanger} onPress={logout}>
        <Text style={styles.buttonText}>SAIR</Text>
      </TouchableOpacity>
    </View>
  );
}
