import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import Card from '../components/Card';
import { alertApi } from '../services/api';
import { connectSocket } from '../services/socket';
import { formatDate } from '../utils/date';
import { styles } from '../utils/styles';

function isEmergency(alert) {
  return ['FOGO', 'OFFLINE', 'PAYLOAD_INVALIDO'].includes(alert.type) || alert.message?.toLowerCase().includes('emergência');
}

export default function AlertsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await alertApi.list();
      setItems(response.data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar alertas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('reading:new', (reading) => {
      if (reading?.fogo || reading?.estado === 'EMERGENCIA') load();
    });
    socket.on('device:offline', load);
    socket.on('invalid-payload', load);
    return () => {
      socket.off('reading:new');
      socket.off('device:offline');
      socket.off('invalid-payload');
    };
  }, [load]);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        refreshing={loading}
        onRefresh={load}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.muted}>Nenhum alerta registrado.</Text>}
        renderItem={({ item }) => (
          <Card danger={isEmergency(item)}>
            <Text style={[styles.subtitle, isEmergency(item) && styles.dangerText]}>{item.type}</Text>
            <Text style={styles.text}>{item.message}</Text>
            <Text style={styles.muted}>Dispositivo: {item.device?.name || '—'}</Text>
            <Text style={styles.muted}>Valor: {item.value ?? '—'}</Text>
            <Text style={styles.muted}>{formatDate(item.createdAt)}</Text>
          </Card>
        )}
      />
    </View>
  );
}
