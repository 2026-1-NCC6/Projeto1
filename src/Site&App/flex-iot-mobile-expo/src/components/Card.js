import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../utils/styles';

export default function Card({ title, value, subtitle, children, danger }) {
  return (
    <View style={[styles.card, danger && styles.cardDanger]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {value ? <Text style={[styles.cardValue, danger && styles.dangerText]}>{value}</Text> : null}
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}
