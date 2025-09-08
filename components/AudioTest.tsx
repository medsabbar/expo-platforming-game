import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { audioManager } from '@/utils/AudioManager';

export const AudioTest: React.FC = () => {
  useEffect(() => {
    const initAudio = async () => {
      console.log('Initializing audio manager...');
      await audioManager.initialize();
      console.log('Audio manager initialized');
    };
    
    initAudio();
    
    return () => {
      audioManager.cleanup();
    };
  }, []);

  const handlePlayBackgroundMusic = async () => {
    console.log('Playing background music...');
    await audioManager.playBackgroundMusic();
  };

  const handleStopBackgroundMusic = async () => {
    console.log('Stopping background music...');
    await audioManager.stopBackgroundMusic();
  };

  const handlePlayJump = async () => {
    console.log('Playing jump sound...');
    await audioManager.playSoundEffect('jump');
  };

  const handlePlayDeath = async () => {
    console.log('Playing death sound...');
    await audioManager.playSoundEffect('death');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Test</Text>
      <Text style={styles.subtitle}>
        Testing expo-audio implementation
      </Text>
      
      <View style={styles.buttonGroup}>
        <Text style={styles.groupTitle}>Background Music</Text>
        <Pressable style={styles.button} onPress={handlePlayBackgroundMusic}>
          <Text style={styles.buttonText}>Play Background Music</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleStopBackgroundMusic}>
          <Text style={styles.buttonText}>Stop Background Music</Text>
        </Pressable>
      </View>

      <View style={styles.buttonGroup}>
        <Text style={styles.groupTitle}>Sound Effects</Text>
        <Pressable style={styles.button} onPress={handlePlayJump}>
          <Text style={styles.buttonText}>Play Jump Sound</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handlePlayDeath}>
          <Text style={styles.buttonText}>Play Death Sound</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        Check browser console for audio logs.{'\n'}
        Since audio files are placeholders, you should hear programmatic sounds on web.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    marginBottom: 30,
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 20,
  },
});