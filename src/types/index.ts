export interface Profile {
  id: string
  username: string
  role: 'mahasiswa' | 'admin'
  created_at: string
}

export interface Mahasiswa {
  id: string
  NIM: string
}

export interface Komunitas {
  id: string
  Nama_komunitas: string
  deskripsi_komunitas: string
}

export interface LearningPath {
  id: string
  Nama_Learning_Path: string
  deskripsi: string
}

export interface KomunitasLearningPath {
  komunitas_id: string
  Learning_Path_id: string
  learningpath?: LearningPath
}

export interface RoadmapNode {
  id: string
  learningpath_id: string
  judul: string
  urutan: number
}

export interface Materi {
  id: string
  roadmapnode_id: string
  judul: string
  konten: string
  created_at: string
}

export interface Progress {
  user_id: string
  roadmapnode_id: string
  status: string
  updated_at: string
}
