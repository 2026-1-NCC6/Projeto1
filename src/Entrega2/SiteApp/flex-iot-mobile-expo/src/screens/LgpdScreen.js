import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from '../utils/styles';

export default function LgpdScreen() {
  const { acceptLgpd } = useAuth();

  return (
    <View style={[styles.container, styles.center]}>
      <Text style={styles.title}>Termos e LGPD</Text>
      <Text style={[styles.text, { textAlign: 'center', lineHeight: 22 }]}>Este aplicativo usa seus dados de login e preferências apenas para acesso ao monitoramento IoT, histórico, alertas e acompanhamento dos ambientes cadastrados.</Text>
      <Text style={[styles.muted, { textAlign: 'center' }]}>Ao continuar, você concorda com o uso dos dados necessários para funcionamento do sistema.</Text>
      <TouchableOpacity style={styles.button} onPress={acceptLgpd}>
        <Text style={styles.buttonText}>ACEITAR E CONTINUAR</Text>
      </TouchableOpacity>
    </View>
  );
}
