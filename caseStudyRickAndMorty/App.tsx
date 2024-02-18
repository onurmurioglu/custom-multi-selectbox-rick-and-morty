import {View, Text, SafeAreaView, StyleSheet} from 'react-native';
import React from 'react';
import CustomMultiSelect from './src/components/CustomMultiSelect';

const App = () => {
  const options = [];

  return (
    <SafeAreaView style={styles.container}>
      <CustomMultiSelect options={options} />
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
});
