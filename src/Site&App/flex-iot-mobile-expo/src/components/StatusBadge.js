import React from 'react';
import { Text } from 'react-native';
import { colors, styles } from '../utils/styles';

export default function StatusBadge({ status }) {
  const value = status || 'NORMAL';
  const color = value === 'OFFLINE' || value === 'EMERGENCIA' ? colors.red : value === 'ALERTA' ? colors.yellow : colors.green;
  return <Text style={[styles.badge, { borderColor: color, color }]}>{value}</Text>;
}
