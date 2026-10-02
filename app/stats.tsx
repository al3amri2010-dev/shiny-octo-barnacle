import { StyleSheet, Text, View } from 'react-native';

import { darkPalette } from '@/ui/theme';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkPalette.background,
  },
  title: { color: darkPalette.text, fontSize: 24 },
});
