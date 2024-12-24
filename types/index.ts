export type Folder = {
  id: string;
  name: string;
  createdAt: number;
};

export type Flashcard = {
  id: number;
  frontText: string;
  backText: string;
  frontColor: string;
  backColor: string;
  frontLang: string;
  backLang: string;
  folderId?: string;
}; 