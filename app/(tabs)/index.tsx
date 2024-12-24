import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import FlashCardItem from "@/components/FlashCardItem";
import { Flashcard, Folder } from "@/types";
import { Colors } from "@/constants/Colors";

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isNewFolderModalVisible, setIsNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadFolders();
        await loadFlashcards();
        setSelectedFolder(null);
      };

      loadData();
    }, [])
  );

  const loadFolders = async () => {
    try {
      const savedFolders = await AsyncStorage.getItem("folders");
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Could not load folders:", error);
      }
      throw error;
    }
  };

  const loadFlashcards = async () => {
    try {
      const savedCards = await AsyncStorage.getItem("flashcards");
      if (savedCards) {
        setFlashcards(JSON.parse(savedCards));
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Could not load flashcards:", error);
      }
      throw error;
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert("Error", "Folder name cannot be empty");
      return;
    }

    try {
      const newFolder: Folder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        createdAt: Date.now(),
      };

      const updatedFolders = [...folders, newFolder];
      await AsyncStorage.setItem("folders", JSON.stringify(updatedFolders));
      setFolders(updatedFolders);
      setNewFolderName("");
      setIsNewFolderModalVisible(false);
    } catch (error) {
      if (__DEV__) {
        console.error("Could not create folder:", error);
      }
      throw error;
    }
  };

  const getFilteredCards = () => {
    if (!selectedFolder) {
      return flashcards.filter((card) => !card.folderId);
    }
    return flashcards.filter((card) => card.folderId === selectedFolder);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Cards",
      "Are you sure you want to delete all cards? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("flashcards");
              setFlashcards([]);
            } catch (error) {
              if (__DEV__) {
                console.error("Could not delete cards:", error);
              }
              throw error;
            }
          },
        },
      ]
    );
  };

  const handleDeleteFolder = async (folderId: string) => {
    Alert.alert(
      "Delete Folder",
      "Are you sure? All cards in this folder will be moved to 'All Cards'.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedFolders = folders.filter((f) => f.id !== folderId);
              await AsyncStorage.setItem(
                "folders",
                JSON.stringify(updatedFolders)
              );

              const savedCards = await AsyncStorage.getItem("flashcards");
              if (savedCards) {
                const cards = JSON.parse(savedCards);
                const updatedCards = cards.map((card: Flashcard) => {
                  if (card.folderId === folderId) {
                    return { ...card, folderId: null };
                  }
                  return card;
                });
                await AsyncStorage.setItem(
                  "flashcards",
                  JSON.stringify(updatedCards)
                );
              }

              setFolders(updatedFolders);
              setSelectedFolder(null);
              loadFlashcards();
            } catch (error) {
              if (__DEV__) {
                console.error("Could not delete folder:", error);
              }
              throw error;
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {selectedFolder ? (
        <View>
          <View style={styles.folderHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedFolder(null)}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.folderTitleContainer}
              onPress={() => {
                const folder = folders.find((f) => f.id === selectedFolder);
                if (folder) {
                  Alert.prompt(
                    "Rename Folder",
                    "Enter new folder name",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Save",
                        onPress: async (newName?: string) => {
                          if (newName?.trim()) {
                            try {
                              const updatedFolders = folders.map((f) =>
                                f.id === selectedFolder
                                  ? { ...f, name: newName.trim() }
                                  : f
                              );
                              await AsyncStorage.setItem(
                                "folders",
                                JSON.stringify(updatedFolders)
                              );
                              setFolders(updatedFolders);
                            } catch (error) {
                              if (__DEV__) {
                                console.error("Could not rename folder:", error);
                              }
                              throw error;
                            }
                          }
                        },
                      },
                    ],
                    "plain-text",
                    folder.name
                  );
                }
              }}
            >
              <Text style={styles.folderTitle}>
                {folders.find((f) => f.id === selectedFolder)?.name}
              </Text>
              <Ionicons name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteFolder(selectedFolder)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>

          {getFilteredCards().length > 0 ? (
            <FlatList
              data={getFilteredCards()}
              renderItem={({ item }) => (
                <FlashCardItem
                  flashcard={item}
                  onDelete={() => loadFlashcards()}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="folder-open-outline"
                size={64}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyTitle}>Empty Folder</Text>
              <Text style={styles.emptyText}>
                Add cards to this folder to start learning
              </Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Flashcards</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => setIsNewFolderModalVisible(true)}
                style={styles.headerButton}
              >
                <Ionicons name="folder-open" size={24} color={Colors.primary} />
              </TouchableOpacity>
              {flashcards.length > 0 && (
                <TouchableOpacity
                  onPress={handleDeleteAll}
                  style={styles.headerButton}
                >
                  <Ionicons name="trash-bin" size={24} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView horizontal style={styles.folderList}>
            <TouchableOpacity
              style={[
                styles.folderChip,
                !selectedFolder && styles.selectedFolder,
              ]}
              onPress={() => setSelectedFolder(null)}
            >
              <Text
                style={[
                  styles.folderText,
                  !selectedFolder && styles.selectedFolderText,
                ]}
              >
                All Cards
              </Text>
            </TouchableOpacity>
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[
                  styles.folderChip,
                  selectedFolder === folder.id && styles.selectedFolder,
                ]}
                onPress={() => setSelectedFolder(folder.id)}
              >
                <View style={styles.folderContent}>
                  <Text
                    style={[
                      styles.folderText,
                      selectedFolder === folder.id && styles.selectedFolderText,
                    ]}
                  >
                    {folder.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {getFilteredCards().length > 0 ? (
            <FlatList
              data={getFilteredCards()}
              renderItem={({ item }) => (
                <FlashCardItem
                  flashcard={item}
                  onDelete={() => loadFlashcards()}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="card-outline"
                size={64}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyTitle}>No Cards Yet</Text>
              <Text style={styles.emptyText}>
                Create your first flashcard to start learning
              </Text>
            </View>
          )}
        </>
      )}

      <Modal
        visible={isNewFolderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsNewFolderModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Folder</Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Enter folder name"
              style={styles.modalInput}
              maxLength={21}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsNewFolderModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateFolder}
                style={[styles.modalButton, styles.createButton]}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    textAlign: "center",
    elevation: 5,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 30,
    textAlign: "center",
    verticalAlign: "middle",
    lineHeight: 57,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  deleteAllButton: {
    padding: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightBlack,
    textAlign: "center",
    lineHeight: 24,
  },
  folderList: {
    maxHeight: 50,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  folderChip: {
    paddingHorizontal: 12,
    paddingVertical: 14,
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
  headerButtons: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.text,
  },
  createButtonText: {
    color: Colors.white,
  },
  folderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteFolderButton: {
    padding: 2,
  },
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    padding: 4,
  },
  folderTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  folderTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 4,
  },
});
