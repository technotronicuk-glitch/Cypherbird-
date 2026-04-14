import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import CryptoJS from 'crypto-js';

export default function App() {
  const [passkey, setPasskey] = useState(''); 
  const [inputData, setInputData] = useState(''); 
  const [gibberishCode, setGibberishCode] = useState(''); 
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- 1. PICK PHOTO/VIDEO ---
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true, 
      quality: 0.2, // Keeps the code size smaller for social media DMs
    });

    if (!result.canceled) {
      encryptData(result.assets[0].base64, true);
    }
  };

  // --- 2. ENCRYPT (MAKE GIBBERISH) ---
  const encryptData = (dataToEncrypt, isMedia = false) => {
    if (!passkey) {
      Alert.alert("Wait!", "You need to set a Secret Passkey first.");
      return;
    }
    
    setLoading(true);
    try {
      const target = isMedia ? dataToEncrypt : inputData;
      const encrypted = CryptoJS.AES.encrypt(target, passkey).toString();
      setGibberishCode(encrypted);
      Alert.alert("Success", "Converted to Gibberish! Copy it to your DM.");
    } catch (e) {
      Alert.alert("Error", "Encryption failed.");
    }
    setLoading(false);
  };

  // --- 3. DECRYPT (READ GIBBERISH) ---
  const handleDecrypt = async () => {
    const copiedText = await Clipboard.getStringAsync();
    if (!passkey) {
      Alert.alert("Error", "Enter the secret passkey to decode.");
      return;
    }

    setLoading(true);
    try {
      const bytes = CryptoJS.AES.decrypt(copiedText, passkey);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!original) throw new Error("Invalid");

      // Check if it's a photo or just text
      if (original.length > 1000) {
        setDecryptedContent({ type: 'image', uri: `data:image/jpeg;base64,${original}` });
      } else {
        setDecryptedContent({ type: 'text', value: original });
      }
    } catch (e) {
      Alert.alert("Error", "Invalid Code or Wrong Passkey!");
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(gibberishCode);
    Alert.alert("Copied!", "Now paste this into your DM.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}}>
      <Text style={styles.title}>CYPHERBIRD</Text>
      <Text style={styles.subtitle}>Privacy Buffer for Social Media</Text>
      
      {/* PASSKEY SECTION */}
      <View style={styles.card}>
        <Text style={styles.label}>🔑 Step 1: Secret Handshake</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter shared passkey..." 
          secureTextEntry
          placeholderTextColor="#999"
          onChangeText={setPasskey}
        />
      </View>

      {/* SENDER SECTION */}
      <View style={styles.card}>
        <Text style={styles.label}>📤 Step 2: Encrypt (Sender)</Text>
        <TextInput 
          style={[styles.input, {height: 50}]} 
          placeholder="Type a secret message..." 
          onChangeText={setInputData}
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={pickMedia}>
            <Text style={styles.btnText}>Pick Media</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, {backgroundColor: '#5856D6'}]} onPress={() => encryptData()}>
            <Text style={styles.btnText}>Encrypt Text</Text>
          </TouchableOpacity>
        </View>
        
        {loading && <ActivityIndicator size="small" color="#5856D6" style={{marginTop: 10}} />}

        {gibberishCode ? (
          <TouchableOpacity onPress={copyToClipboard} style={styles.codeBox}>
            <Text numberOfLines={2} style={styles.codeText}>{gibberishCode}</Text>
            <Text style={styles.copyHint}>Tap to Copy Gibberish</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* RECEIVER SECTION */}
      <View style={styles.card}>
        <Text style={styles.label}>📥 Step 3: Decrypt (Receiver)</Text>
        <TouchableOpacity style={[styles.btn, {width: '100%', backgroundColor: '#FF9500'}]} onPress={handleDecrypt}>
          <Text style={styles.btnText}>Paste Code & View</Text>
        </TouchableOpacity>

        {decryptedContent && (
          <View style={styles.resultContainer}>
            {decryptedContent.type === 'image' ? (
              <Image source={{ uri: decryptedContent.uri }} style={styles.preview} />
            ) : (
              <Text style={styles.resultText}>Message: {decryptedContent.value}</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'center', color: '#1C1C1E', letterSpacing: 2 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#8E8E93', marginBottom: 30 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { fontWeight: 'bold', marginBottom: 15, fontSize: 16, color: '#3A3A3C' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 12, marginBottom: 15, color: '#000' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  codeBox: { marginTop: 15, padding: 15, backgroundColor: '#E5E5EA', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C7C7CC' },
  codeText: { fontSize: 10, color: '#48484A', fontFamily: 'monospace' },
  copyHint: { fontSize: 12, textAlign: 'center', marginTop: 8, color: '#007AFF', fontWeight: '600' },
  resultContainer: { marginTop: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 20 },
  preview: { width: '100%', height: 250, borderRadius: 10, resizeMode: 'contain' },
  resultText: { fontSize: 18, fontWeight: '600', color: '#34C759' }
});
