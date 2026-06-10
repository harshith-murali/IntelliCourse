import { Redirect } from 'expo-router';
import { useAuth } from '../hooks';
import { View } from 'react-native';

export default function Index() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === undefined) {
    return <View style={{ flex: 1 }} />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}
