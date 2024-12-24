import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from '@react-navigation/native';
import React from "react";
import { LANGUAGES } from "@/constants/Languages";
import { Colors } from "@/constants/Colors";
import { Folder } from "@/types";
import { isLightColor } from "@/utils/colors";

const COLORS = [
  '#FFFFFF',
  '#FFE5B4',
  '#E5E5EA',
  '#90EE90',
  '#ADD8E6',
  '#FFB6C1',
  '#DDA0DD',
  '#F0E68C',
];

export default function AddCard() {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [frontColor, setFrontColor] = useState(Colors.white);
  const [backColor, setBackColor] = useState(Colors.secondary);
  const [frontLang, setFrontLang] = useState("en-US");
  const [backLang, setBackLang] = useState("tr-TR");
  const [modalVisible, setModalVisible] = useState(false);
  const [isSelectingFront, setIsSelectingFront] = useState(true);
  const [modalType, setModalType] = useState<'color' | 'language'>('color');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadFolders();
    }, [])
  );

  const loadFolders = async () => {
    try {
      const savedFolders = await AsyncStorage.getItem('folders');
      if (savedFolders) {
        const parsedFolders = JSON.parse(savedFolders);
        setFolders(parsedFolders);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Could not load folders:', error);
      }
      throw error;
    }
  };

  const openModal = (isFront: boolean, type: 'color' | 'language') => {
    setIsSelectingFront(isFront);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!frontText.trim() || !backText.trim()) {
      Alert.alert(
        "Missing Information",
        "Front and back of the card cannot be empty.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    try {
      const newCard = { 
        id: Date.now(), 
        frontText: frontText.trim(),
        backText: backText.trim(),
        frontColor,
        backColor,
        frontLang,
        backLang,
        folderId: selectedFolderId
      };
      
      const existingCards = await AsyncStorage.getItem('flashcards');
      let cards = existingCards ? JSON.parse(existingCards) : [];
      
      cards.push(newCard);
      
      await AsyncStorage.setItem('flashcards', JSON.stringify(cards));
      
      setFrontText("");
      setBackText("");
      setFrontColor(Colors.white);
      setBackColor(Colors.secondary);
      setFrontLang("en-US");
      setBackLang("tr-TR");
      setSelectedFolderId(null);
      
      await AsyncStorage.setItem('lastSelectedFolder', '');
      
      router.push('/');
    } catch (error) {
      if (__DEV__) {
        console.error('Could not save card:', error);
      }
      throw error;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Select Folder (Optional)</Text>
          <ScrollView 
            horizontal 
            style={styles.folderList}
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity 
              style={[styles.folderChip, !selectedFolderId && styles.selectedFolder]}
              onPress={() => setSelectedFolderId(null)}
            >
              <Text style={[styles.folderText, !selectedFolderId && styles.selectedFolderText]}>
                No Folder
              </Text>
            </TouchableOpacity>
            {folders.map((folder: Folder) => (
              <TouchableOpacity 
                key={folder.id}
                style={[styles.folderChip, selectedFolderId === folder.id && styles.selectedFolder]}
                onPress={() => setSelectedFolderId(folder.id)}
              >
                <Text style={[styles.folderText, selectedFolderId === folder.id && styles.selectedFolderText]}>
                  {folder.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Front Side</Text>
          <TextInput
            value={frontText}
            onChangeText={setFrontText}
            placeholder="Enter the first word"
            placeholderTextColor={isLightColor(frontColor) ? Colors.text : Colors.white}
            style={[styles.input, { backgroundColor: frontColor }]}
          />
          <View style={styles.optionsRow}>
            <Pressable 
              style={styles.optionButton} 
              onPress={() => openModal(true, 'color')}
            >
              <Text style={styles.optionText}>Color</Text>
              <View style={[styles.colorPreview, { backgroundColor: frontColor }]} />
            </Pressable>
            <Pressable 
              style={styles.optionButton}
              onPress={() => openModal(true, 'language')}
            >
              <Text style={styles.optionText}>Language</Text>
              <Text style={styles.selectedOption}>
                {LANGUAGES.find(l => l.code === frontLang)?.label}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Back Side</Text>
          <TextInput
            value={backText}
            onChangeText={setBackText}
            placeholder="Enter the second word"
            placeholderTextColor={isLightColor(backColor) ? Colors.text : Colors.white}
            style={[styles.input, { backgroundColor: backColor }]}
          />
          <View style={styles.optionsRow}>
            <Pressable 
              style={styles.optionButton}
              onPress={() => openModal(false, 'color')}
            >
              <Text style={styles.optionText}>Color</Text>
              <View style={[styles.colorPreview, { backgroundColor: backColor }]} />
            </Pressable>
            <Pressable 
              style={styles.optionButton}
              onPress={() => openModal(false, 'language')}
            >
              <Text style={styles.optionText}>Language</Text>
              <Text style={styles.selectedOption}>
                {LANGUAGES.find(l => l.code === backLang)?.label}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <Pressable 
          style={styles.saveButton} 
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>Add Card</Text>
        </Pressable>

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {modalType === 'color' ? 'Color' : 'Language'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              {modalType === 'color' ? (
                <View style={styles.colorContainer}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        (isSelectingFront ? frontColor : backColor) === color && styles.selectedColor
                      ]}
                      onPress={() => {
                        isSelectingFront ? setFrontColor(color) : setBackColor(color);
                        setModalVisible(false);
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.langContainer}>
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang.code}
                      style={[
                        styles.langButton,
                        (isSelectingFront ? frontLang : backLang) === lang.code && styles.selectedLang
                      ]}
                      onPress={() => {
                        isSelectingFront ? setFrontLang(lang.code) : setBackLang(lang.code);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.langText,
                        (isSelectingFront ? frontLang : backLang) === lang.code && styles.selectedLangText
                      ]}>
                        {lang.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedOption: {
    fontSize: 16,
    color: Colors.primary,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  buttonText: {
    color: Colors.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.lightOrange,
  },
  colorButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary,
    color: Colors.white,
  },
  colorGrid: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    width: "80%",
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  langContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  selectedLang: {
    backgroundColor: Colors.secondary,
  },
  langText: {
    color: Colors.secondary,
    fontSize: 14,
  },
  selectedLangText: {
    color: Colors.white,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  folderList: {
    maxHeight: 50,
    marginBottom: 20,
  },
  folderChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  selectedFolder: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  folderText: {
    color: Colors.text,
    fontSize: 14,
  },
  selectedFolderText: {
    color: Colors.white,
  },
});
