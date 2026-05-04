import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { environmentApi } from '../services/api';
import { styles } from '../utils/styles';

function environmentStatus(environment) {
  const devices = environment.devices || [];
  if (!environment.active) return 'INATIVO';
  if (devices.some((d) => d.status === 'EMERGENCIA')) return 'EMERGENCIA';
  if (devices.some((d) => d.status === 'ALERTA')) return 'ALERTA';
  if (devices.length && devices.every((d) => d.status === 'OFFLINE')) return 'OFFLINE';
  if (devices.some((d) => d.status === 'OFFLINE')) return 'ALERTA';
  return 'NORMAL';
}

export default function EnvironmentsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await environmentApi.list();
      setItems(response.data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar ambientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        refreshing={loading}
        onRefresh={load}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.muted}>Nenhum ambiente cadastrado.</Text>}
        renderItem={({ item }) => {
          const status = environmentStatus(item);
          return (
            <TouchableOpacity onPress={() => navigation.navigate('AmbienteDetalhes', { environment: item })}>
              <Card danger={status === 'EMERGENCIA' || status === 'OFFLINE'}>
                <View style={styles.row}>
                  <Text style={styles.subtitle}>{item.name}</Text>
                  <StatusBadge status={status} />
                </View>
                <Text style={styles.muted}>{item.description || 'Sem descrição'}</Text>
                <Text style={styles.text}>Dispositivos: {item.devices?.length || 0}</Text>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
