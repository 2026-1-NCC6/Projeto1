import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime } from '../utils/date';

const screenWidth = Dimensions.get('window').width;

const MAX_READINGS_IN_MEMORY = 300;
const MAX_POINTS_ON_CHART = 12;

export default function EnvironmentDetailScreen({ route }) {
  const { environment } = route.params;

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [readings, setReadings] = useState([]);
  const [latestReading, setLatestReading] = useState(null);

  async function loadReadings(selectedPeriod = period) {
    try {
      setLoading(true);

      const now = new Date();
      const from = new Date();

      if (selectedPeriod === '24h') {
        from.setHours(now.getHours() - 24);
      }

      if (selectedPeriod === '7d') {
        from.setDate(now.getDate() - 7);
      }

      const query = new URLSearchParams({
        from: from.toISOString(),
        to: now.toISOString(),
        limit: String(MAX_READINGS_IN_MEMORY)
      });

      const data = await api.get(`/readings?${query.toString()}`);

      const filtered = Array.isArray(data.data)
        ? data.data.filter(
            item =>
              item.device?.environmentId === environment.id ||
              item.device?.environment?.id === environment.id
          )
        : [];

      const limited = filtered.slice(0, MAX_READINGS_IN_MEMORY);

      setReadings(limited);

      if (limited.length > 0) {
        setLatestReading(limited[0]);
      } else {
        setLatestReading(null);
      }
    } catch (error) {
      console.log('Erro ao carregar leituras:', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReadings(period);

    const socket = connectSocket();

    socket.on('reading:new', reading => {
      const belongsToEnvironment =
        reading.device?.environmentId === environment.id ||
        reading.device?.environment?.id === environment.id;

      if (!belongsToEnvironment) {
        return;
      }

      setLatestReading(reading);

      setReadings(prev => {
        const updated = [reading, ...prev];
        return updated.slice(0, MAX_READINGS_IN_MEMORY);
      });
    });

    return () => {
      socket.off('reading:new');
      disconnectSocket();
    };
  }, [environment.id, period]);

  function changePeriod(value) {
    setPeriod(value);
    loadReadings(value);
  }

  const chartData = useMemo(() => {
    const ordered = [...readings].reverse();

    const sampled = sampleForMobileChart(ordered, MAX_POINTS_ON_CHART);

    const labels = sampled.map((item, index) => {
      if (!item.createdAt) return '';

      const time = new Date(item.createdAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const isFirst = index === 0;
      const isMiddle = index === Math.floor(sampled.length / 2);
      const isLast = index === sampled.length - 1;

      if (isFirst || isMiddle || isLast) {
        return time;
      }

      return '';
    });

    const temperature = sampled.map(item =>
      typeof item.temperature === 'number' ? item.temperature : 0
    );

    const humidity = sampled.map(item =>
      typeof item.humidity === 'number' ? item.humidity : 0
    );

    return {
      labels: labels.length > 0 ? labels : [''],
      datasets: [
        {
          data: temperature.length > 0 ? temperature : [0],
          color: opacity => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 3
        },
        {
          data: humidity.length > 0 ? humidity : [0],
          color: opacity => `rgba(0, 200, 140, ${opacity})`,
          strokeWidth: 3
        }
      ],
      legend: ['Temperatura °C', 'Umidade %']
    };
  }, [readings]);

  const hasChartData = readings.length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{environment.name}</Text>
          <Text style={styles.subtitle}>
            Monitoramento em tempo real do ambiente
          </Text>
        </View>

        <StatusBadge status={latestReading?.estado || environment.status || 'OFFLINE'} />
      </View>

      <View style={styles.cards}>
        <Card
          title="Temperatura"
          value={
            latestReading?.temperature !== undefined &&
            latestReading?.temperature !== null
              ? `${latestReading.temperature.toFixed(1)} °C`
              : '—'
          }
        />

        <Card
          title="Umidade"
          value={
            latestReading?.humidity !== undefined &&
            latestReading?.humidity !== null
              ? `${latestReading.humidity.toFixed(1)} %`
              : '—'
          }
        />

        <Card
          title="Pressão"
          value={
            latestReading?.pressure !== undefined &&
            latestReading?.pressure !== null
              ? `${latestReading.pressure.toFixed(1)} hPa`
              : '—'
          }
        />

        <Card
          title="Gás"
          value={
            latestReading?.gas !== undefined && latestReading?.gas !== null
              ? String(latestReading.gas)
              : '—'
          }
        />

        <Card
          title="Fogo"
          value={
            latestReading?.fogo === true
              ? 'SIM'
              : latestReading?.fogo === false
              ? 'NÃO'
              : '—'
          }
          danger={latestReading?.fogo === true}
        />
      </View>

      {latestReading?.fogo === true && (
        <View style={styles.fireAlert}>
          <Text style={styles.fireAlertText}>⚠ FOGO DETECTADO — EMERGÊNCIA</Text>
        </View>
      )}

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Gráfico das leituras recebidas</Text>
            <Text style={styles.chartSubtitle}>
              Mostra uma amostra das leituras do período selecionado.
            </Text>
          </View>
        </View>

        <View style={styles.periodButtons}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === '24h' && styles.periodButtonActive
            ]}
            onPress={() => changePeriod('24h')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === '24h' && styles.periodButtonTextActive
              ]}
            >
              24h
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              period === '7d' && styles.periodButtonActive
            ]}
            onPress={() => changePeriod('7d')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === '7d' && styles.periodButtonTextActive
              ]}
            >
              7 dias
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.chartHelp}>
          {period === '24h'
            ? 'Período: últimas 24 horas.'
            : 'Período: últimos 7 dias.'}{' '}
          O gráfico exibe até {MAX_POINTS_ON_CHART} pontos para manter a leitura clara.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#00e5a0" />
            <Text style={styles.loadingText}>Carregando leituras...</Text>
          </View>
        ) : !hasChartData ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Aguardando dados para montar o gráfico...
            </Text>
          </View>
        ) : (
          <>
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={280}
              bezier
              withShadow
              withDots={false}
              withInnerLines
              withOuterLines={false}
              withVerticalLines={false}
              fromZero
              chartConfig={{
                backgroundColor: '#161a23',
                backgroundGradientFrom: '#161a23',
                backgroundGradientTo: '#161a23',
                decimalPlaces: 1,
                color: opacity => `rgba(232, 234, 240, ${opacity})`,
                labelColor: opacity => `rgba(123, 129, 155, ${opacity})`,
                propsForBackgroundLines: {
                  stroke: '#252a38',
                  strokeDasharray: '4'
                },
                fillShadowGradientFrom: '#64b5f6',
                fillShadowGradientTo: '#00e5a0',
                fillShadowGradientFromOpacity: 0.35,
                fillShadowGradientToOpacity: 0.08
              }}
              style={styles.chart}
            />

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2196f3' }]} />
                <Text style={styles.legendText}>Temperatura °C</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#00c88c' }]} />
                <Text style={styles.legendText}>Umidade %</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Última leitura</Text>

        {latestReading ? (
          <>
            <Text style={styles.infoText}>
              Dispositivo: {latestReading.device?.name || '—'}
            </Text>
            <Text style={styles.infoText}>
              Estado: {latestReading.estado || '—'}
            </Text>
            <Text style={styles.infoText}>
              Recebido em: {formatDateTime(latestReading.createdAt)}
            </Text>
          </>
        ) : (
          <Text style={styles.infoText}>Nenhuma leitura recebida ainda.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function sampleForMobileChart(items, maxPoints = MAX_POINTS_ON_CHART) {
  if (!items || items.length <= maxPoints) {
    return items || [];
  }

  const step = Math.ceil(items.length / maxPoints);

  return items.filter((_, index) => index % step === 0).slice(0, maxPoints);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
    padding: 16
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start'
  },
  title: {
    color: '#e8eaf0',
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    color: '#7b819b',
    marginTop: 4
  },
  cards: {
    gap: 12
  },
  fireAlert: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    borderWidth: 1,
    borderColor: '#ff4757',
    padding: 14,
    borderRadius: 8
  },
  fireAlertText: {
    color: '#ff4757',
    fontWeight: '700',
    textAlign: 'center'
  },
  chartCard: {
    marginTop: 16,
    backgroundColor: '#161a23',
    borderWidth: 1,
    borderColor: '#252a38',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 0,
    overflow: 'hidden'
  },
  chartHeader: {
    paddingHorizontal: 16,
    marginBottom: 12
  },
  chartTitle: {
    color: '#e8eaf0',
    fontSize: 17,
    fontWeight: '700'
  },
  chartSubtitle: {
    color: '#7b819b',
    marginTop: 4,
    fontSize: 13
  },
  chartHelp: {
    color: '#7b819b',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  periodButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8
  },
  periodButton: {
    borderWidth: 1,
    borderColor: '#252a38',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  periodButtonActive: {
    borderColor: '#00e5a0',
    backgroundColor: 'rgba(0, 229, 160, 0.08)'
  },
  periodButtonText: {
    color: '#7b819b',
    fontWeight: '600'
  },
  periodButtonTextActive: {
    color: '#00e5a0'
  },
  chart: {
    marginVertical: 8,
    marginLeft: -8,
    borderRadius: 10
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    color: '#7b819b',
    fontSize: 12
  },
  loadingBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#7b819b',
    marginTop: 8
  },
  emptyBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  emptyText: {
    color: '#7b819b',
    textAlign: 'center'
  },
  infoCard: {
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#161a23',
    borderWidth: 1,
    borderColor: '#252a38',
    borderRadius: 10,
    padding: 16
  },
  infoTitle: {
    color: '#e8eaf0',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8
  },
  infoText: {
    color: '#7b819b',
    marginBottom: 4
  }
});