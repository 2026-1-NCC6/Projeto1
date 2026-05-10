import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import Card from '../components/Card';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { formatDate } from '../utils/date';
import { styles } from '../utils/styles';
import { numberValue, temperature } from '../utils/units';

const MAX_LATEST_READINGS = 30;

export default function DashboardScreen() {
  const { preferences } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [socketStatus, setSocketStatus] = useState('desconectado');

  const load = useCallback(async () => {
    const response = await dashboardApi.get();

    setData({
      ...response.data,
      latest: (response.data?.latest || []).slice(0, MAX_LATEST_READINGS)
    });
  }, []);

  useEffect(() => {
    load().catch(() => Alert.alert('Erro', 'Não foi possível carregar o dashboard.'));

    const interval = setInterval(
      () => load().catch(() => {}),
      preferences.refreshInterval || 15000
    );

    return () => clearInterval(interval);
  }, [load, preferences.refreshInterval]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => setSocketStatus('conectado'));
    socket.on('disconnect', () => setSocketStatus('desconectado'));

    socket.on('reading:new', reading => {
      if (!reading || !reading.device) return;

      setData(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          latest: [reading, ...(prev.latest || [])].slice(0, MAX_LATEST_READINGS),
          devices: (prev.devices || []).map(device =>
            device.id === reading.deviceId
              ? {
                  ...device,
                  status: reading.device?.status || device.status,
                  lastSeenAt: reading.createdAt
                }
              : device
          )
        };
      });

      if (reading.fogo || reading.estado === 'EMERGENCIA') {
        Alert.alert(
          '🚨 Emergência',
          `Fogo/emergência detectado em ${reading.device?.name || 'dispositivo'}.`
        );
      }
    });

    socket.on('device:offline', () => load().catch(() => {}));

    socket.on('invalid-payload', () =>
      Alert.alert('Payload inválido', 'O backend recebeu uma mensagem MQTT inválida.')
    );

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reading:new');
      socket.off('device:offline');
      socket.off('invalid-payload');
      disconnectSocket();
    };
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load().catch(() => Alert.alert('Erro', 'Não foi possível atualizar.'));
    setRefreshing(false);
  }

  if (!data) return <Loading message="Carregando dashboard..." />;

  const online = data.devices?.filter(device => device.status !== 'OFFLINE').length || 0;
  const offline = data.devices?.filter(device => device.status === 'OFFLINE').length || 0;
  const emergency =
    data.devices?.filter(device => device.status === 'EMERGENCIA').length || 0;

  const latestReadings = (data.latest || []).slice(0, MAX_LATEST_READINGS);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <Text style={styles.muted}>
        Socket.IO: {socketStatus} | MQTT: {data.mqtt?.status || '—'}
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
        <View style={{ flex: 1 }}>
          <Card title="Online" value={`${online}`} />
        </View>

        <View style={{ flex: 1 }}>
          <Card title="Offline" value={`${offline}`} danger={offline > 0} />
        </View>

        <View style={{ flex: 1 }}>
          <Card title="Emerg." value={`${emergency}`} danger={emergency > 0} />
        </View>
      </View>

      <Text style={styles.subtitle}>Últimas leituras</Text>

      <Text style={styles.muted}>
        Exibindo no máximo as últimas {MAX_LATEST_READINGS} leituras recebidas.
      </Text>

      <FlatList
        data={latestReadings}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.muted}>Nenhuma leitura recebida ainda.</Text>
        }
        renderItem={({ item }) => (
          <Card danger={item.fogo || item.estado === 'EMERGENCIA'}>
            <View style={styles.row}>
              <Text style={styles.subtitle}>
                {item.device?.environment?.name || 'Ambiente'} ·{' '}
                {item.device?.name || 'Dispositivo'}
              </Text>

              <StatusBadge status={item.estado || item.device?.status} />
            </View>

            <Text style={styles.text}>
              Temperatura: {temperature(item.temperature, preferences.unit)}
            </Text>

            <Text style={styles.text}>
              Umidade: {numberValue(item.humidity, '%')}
            </Text>

            <Text style={styles.text}>
              Pressão: {numberValue(item.pressure, ' hPa')}
            </Text>

            <Text style={styles.text}>
              Gás: {item.gas ?? '—'} | Fogo: {item.fogo ? 'SIM' : 'NÃO'}
            </Text>

            <Text style={styles.muted}>{formatDate(item.createdAt)}</Text>
          </Card>
        )}
      />
    </View>
  );
}