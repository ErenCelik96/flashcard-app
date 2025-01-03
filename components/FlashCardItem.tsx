import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  Dimensions,
  Alert,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { isLightColor } from "@/utils/colors";
import { Colors } from "@/constants/Colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

type FlashCardProps = {
  flashcard: {
    id: number;
    frontText: string;
    backText: string;
    frontColor: string;
    backColor: string;
    frontLang: string;
    backLang: string;
  };
  onDelete: () => void;
};

export default function FlashCardItem({ flashcard, onDelete }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleDelete = () => {
    Alert.alert("Delete Card", "Are you sure you want to delete this card?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const savedCards = await AsyncStorage.getItem("flashcards");
            if (savedCards) {
              const cards = JSON.parse(savedCards);
              const filteredCards = cards.filter(
                (card: any) => card.id !== flashcard.id
              );
              await AsyncStorage.setItem(
                "flashcards",
                JSON.stringify(filteredCards)
              );
              onDelete();
            }
          } catch (error) {
            if (__DEV__) {
              console.error("Could not delete card:", error);
            }
            throw error;
          }
        },
      },
    ]);
  };

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 180;

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsFlipped(!isFlipped);
    });
  };

  const interpolateFront = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const interpolateBack = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "0deg"],
  });

  const handleSpeak = async (text: string, language: string) => {
    try {
      const cleanText = text.includes("(")
        ? text.split(" (")[0].trim()
        : text.trim();

      await Speech.speak(cleanText, {
        language: language,
        pitch: 1,
        rate: 0.75,
      });
    } catch (error) {
      if (__DEV__) {
        console.error("Error speaking:", error);
      }
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: flashcard.frontColor },
          { transform: [{ rotateY: interpolateFront }] },
        ]}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.text,
              {
                color: isLightColor(flashcard.frontColor)
                  ? Colors.text
                  : Colors.white,
              },
            ]}
          >
            {flashcard.frontText}
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { backgroundColor: flashcard.backColor },
          { transform: [{ rotateY: interpolateBack }] },
        ]}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.text,
              {
                color: isLightColor(flashcard.backColor)
                  ? Colors.text
                  : Colors.white,
              },
            ]}
          >
            {flashcard.backText}
          </Text>
        </View>
      </Animated.View>
      <View style={styles.buttonsOverlay}>
        <TouchableOpacity
          onPress={() =>
            handleSpeak(
              isFlipped ? flashcard.backText : flashcard.frontText,
              isFlipped ? flashcard.backLang : flashcard.frontLang
            )
          }
          style={styles.iconButton}
        >
          <Ionicons
            name="volume-high"
            size={24}
            color={
              isLightColor(
                isFlipped ? flashcard.backColor : flashcard.frontColor
              )
                ? Colors.primary
                : Colors.white
            }
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={flipCard} style={styles.iconButton}>
          <Ionicons
            name="sync"
            size={24}
            color={
              isLightColor(
                isFlipped ? flashcard.backColor : flashcard.frontColor
              )
                ? Colors.primary
                : Colors.white
            }
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
          <Ionicons
            name="trash-outline"
            size={24}
            color={
              isLightColor(
                isFlipped ? flashcard.backColor : flashcard.frontColor
              )
                ? Colors.primary
                : Colors.white
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 32,
    minHeight: 120,
    marginVertical: 8,
  },
  card: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  cardBack: {
    backgroundColor: Colors.secondary,
  },
  text: {
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
  },
  buttonsOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
    zIndex: 999,
  },
  iconButton: {
    padding: 8,
    zIndex: 1000,
  },
  cardContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
