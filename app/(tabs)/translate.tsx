import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LANGUAGES } from "@/constants/Languages";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

const translateText = async (text: string, from: string, to: string) => {
  try {
    const fromLangCode = from.split("-")[0];
    const toLangCode = to.split("-")[0];

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: fromLangCode,
          target: toLangCode,
          format: "text",
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.data.translations[0].translatedText;
  } catch (error) {
    if (__DEV__) {
      console.error('Translation error:', error);
    }
    throw error;
  }
};

const cyrillicToLatin = (text: string): string => {
  const cyrillicMap: { [key: string]: string } = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "Yo",
    Ж: "Zh",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "H",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Sch",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "Yu",
    Я: "Ya",
  };

  return text
    .split("")
    .map((char) => cyrillicMap[char] || char)
    .join("");
};

const hasCyrillic = (text: string): boolean => {
  return /[а-яА-ЯЁё]/.test(text);
};

export default function Translate() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [fromLang, setFromLang] = useState("en-US");
  const [toLang, setToLang] = useState("tr-TR");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectingLang, setSelectingLang] = useState<"from" | "to">("from");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setText("");
      setResult(null);
      setIsLoading(false);
      setIsButtonDisabled(false);
      setFromLang("en-US");
      setToLang("tr-TR");
    }, [])
  );

  const handleTranslate = async () => {
    if (!text.trim() || isButtonDisabled) return;
    if (text.length > 100) {
      Alert.alert("Error", "Text is too long. Maximum 100 characters allowed.");
      return;
    }

    setIsLoading(true);
    setIsButtonDisabled(true);

    try {
      const translatedText = await translateText(text, fromLang, toLang);

      if (hasCyrillic(translatedText)) {
        const latinVersion = cyrillicToLatin(translatedText);
        setResult(`${translatedText} (${latinVersion})`);
      } else {
        setResult(translatedText);
      }

      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 5000);
    } catch (error) {
      Alert.alert("Error", "Could not translate text. Please try again.", [
        { text: "OK" },
      ]);
      setIsButtonDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const openLangSelector = (type: "from" | "to") => {
    setSelectingLang(type);
    setIsModalVisible(true);
  };

  const handleSelectLanguage = (code: string) => {
    if (selectingLang === "from") {
      setFromLang(code);
    } else {
      setToLang(code);
    }
    setIsModalVisible(false);
  };

  const handleSaveAsCard = async () => {
    if (!result || !text) return;

    try {
      const newCard = {
        id: Date.now(),
        frontText: result.trim(),
        backText: text.trim(),
        frontColor: Colors.white,
        backColor: Colors.secondary,
        frontLang: toLang,
        backLang: fromLang,
        folderId: null,
      };

      const existingCards = await AsyncStorage.getItem("flashcards");
      let cards = existingCards ? JSON.parse(existingCards) : [];
      cards.push(newCard);

      await AsyncStorage.setItem("flashcards", JSON.stringify(cards));

      router.push("/");

      setTimeout(() => {
        Alert.alert("Success", "Card added successfully!", [
          { text: "OK", style: "default" },
        ]);
      }, 100);
    } catch (error) {
      if (__DEV__) {
        console.error("Could not save card:", error);
      }
      throw error;
    }
  };

  return (
    <View style={[styles.container]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Translating...</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Translate</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => openLangSelector("from")}
          >
            <Text style={styles.langButtonText}>
              {LANGUAGES.find((l) => l.code === fromLang)?.label || "Select"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => {
              const temp = fromLang;
              setFromLang(toLang);
              setToLang(temp);
            }}
          >
            <Ionicons name="swap-horizontal" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langButton}
            onPress={() => openLangSelector("to")}
          >
            <Text style={styles.langButtonText}>
              {LANGUAGES.find((l) => l.code === toLang)?.label || "Select"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Enter text to translate"
            placeholderTextColor={Colors.lightGray}
            multiline
            maxLength={100}
          />
          {text.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setText("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.lightGray}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.translateButton,
            (!text.trim() || isButtonDisabled) &&
              styles.translateButtonDisabled,
          ]}
          onPress={handleTranslate}
          disabled={!text.trim() || isLoading || isButtonDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.translateButtonText}>
              {isButtonDisabled ? "Wait 5s..." : "Translate"}
            </Text>
          )}
        </TouchableOpacity>

        {result && (
          <TouchableOpacity
            style={styles.resultContainer}
            onPress={handleSaveAsCard}
          >
            <Text style={styles.resultText}>
              {result.includes("(") ? (
                <>
                  {result.split(" (")[0]}
                  <Text style={styles.latinText}>
                    {" "}
                    ({result.split(" (")[1]}
                  </Text>
                </>
              ) : (
                result
              )}
            </Text>
            <View style={styles.saveHintContainer}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.saveHintText}>Tap to create flashcard</Text>
            </View>
          </TouchableOpacity>
        )}

        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Language</Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.languageList}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      (selectingLang === "from" ? fromLang : toLang) ===
                        lang.code && styles.selectedLanguageItem,
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text
                      style={[
                        styles.languageItemText,
                        (selectingLang === "from" ? fromLang : toLang) ===
                          lang.code && styles.selectedLanguageItemText,
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {(selectingLang === "from" ? fromLang : toLang) ===
                      lang.code && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={Colors.white}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  langButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  langButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  swapButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  clearButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  translateButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  resultText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  saveHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  saveHintText: {
    fontSize: 14,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  selectedLanguageItem: {
    backgroundColor: Colors.primary,
  },
  languageItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedLanguageItemText: {
    color: Colors.white,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
  latinText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
});
