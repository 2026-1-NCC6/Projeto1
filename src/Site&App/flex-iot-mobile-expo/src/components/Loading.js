import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, styles } from '../utils/styles';

export default function Loading({ message = 'Carregando...' }) {
  return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}
