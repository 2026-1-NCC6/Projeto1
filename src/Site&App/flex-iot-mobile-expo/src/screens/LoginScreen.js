import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { styles } from '../utils/styles';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@flex.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Atenção', 'Informe e-mail e senha.');
    setLoading(true);
    await login(email.trim(), password);
    setLoading(false);
  }

  async function handleRecover() {
    if (!email) return Alert.alert('Recuperação de senha', 'Informe o e-mail primeiro.');
    const { data } = await authApi.recoverPassword(email.trim());
    Alert.alert('Recuperação simulada', data.message);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, styles.center]}>
      <View style={{ width: '100%' }}>
        <Text style={styles.title}>Flex IoT</Text>
        <Text style={[styles.muted, { marginBottom: 20 }]}>Acesse o monitoramento ambiental.</Text>

        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="E-mail" placeholderTextColor="#6b7280" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Senha" placeholderTextColor="#6b7280" />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'ENTRANDO...' : 'ENTRAR'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSecondary} onPress={handleRecover}>
          <Text style={styles.buttonSecondaryText}>RECUPERAR SENHA</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
