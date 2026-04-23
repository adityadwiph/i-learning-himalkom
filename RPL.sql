-- =========================
-- TABEL USER
-- =========================
CREATE TABLE users (
    nim VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- =========================
-- TABEL MAHASISWA
-- =========================
CREATE TABLE mahasiswa (
    nim VARCHAR(20) PRIMARY KEY,
    learning_progress TEXT,
    FOREIGN KEY (nim) REFERENCES users(nim) ON DELETE CASCADE
);

-- =========================
-- TABEL ADMIN
-- =========================
CREATE TABLE admin (
    nim VARCHAR(20) PRIMARY KEY,
    is_admin BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (nim) REFERENCES mahasiswa(nim) ON DELETE CASCADE
);

-- =========================
-- TABEL SPESIALISASI
-- =========================
CREATE TABLE spesialisasi (
    spesialisasi_id SERIAL PRIMARY KEY,
    nama_spesialisasi VARCHAR(100) NOT NULL
);

-- =========================
-- TABEL KOMUNITAS
-- =========================
CREATE TABLE komunitas (
    id_komunitas SERIAL PRIMARY KEY,
    nama_komunitas VARCHAR(100) NOT NULL,
    deskripsi_komunitas TEXT,
    spesialisasi_id INT,
    FOREIGN KEY (spesialisasi_id) REFERENCES spesialisasi(spesialisasi_id)
);

-- =========================
-- RELASI MAHASISWA - KOMUNITAS (many-to-many)
-- =========================
CREATE TABLE komunitas_anggota (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(20),
    id_komunitas INT,
    FOREIGN KEY (nim) REFERENCES mahasiswa(nim) ON DELETE CASCADE,
    FOREIGN KEY (id_komunitas) REFERENCES komunitas(id_komunitas) ON DELETE CASCADE
);

-- =========================
-- TABEL LEARNING PATH
-- =========================
CREATE TABLE learning_path (
    path_id SERIAL PRIMARY KEY,
    judul_lp VARCHAR(150) NOT NULL,
    deskripsi_materi TEXT,
    spesialisasi_id INT,
    FOREIGN KEY (spesialisasi_id) REFERENCES spesialisasi(spesialisasi_id)
);

-- =========================
-- TABEL ROADMAP NODE
-- =========================
CREATE TABLE roadmap_node (
    node_id SERIAL PRIMARY KEY,
    path_id INT,
    title VARCHAR(150),
    node_order INT,
    status VARCHAR(50),
    FOREIGN KEY (path_id) REFERENCES learning_path(path_id) ON DELETE CASCADE
);

-- =========================
-- TABEL MATERI
-- =========================
CREATE TABLE materi (
    materi_id SERIAL PRIMARY KEY,
    node_id INT,
    judul_materi VARCHAR(150),
    tipe VARCHAR(10) CHECK (tipe IN ('quiz','video')),
    content_url TEXT,
    updated_by VARCHAR(20),
    FOREIGN KEY (node_id) REFERENCES roadmap_node(node_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES admin(nim)
);

-- =========================
-- TABEL PROGRESS
-- =========================
CREATE TABLE progress (
    progress_id SERIAL PRIMARY KEY,
    nim VARCHAR(20),
    node_id INT,
    status VARCHAR(50),
    completion_date TIMESTAMP,
    FOREIGN KEY (nim) REFERENCES mahasiswa(nim) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES roadmap_node(node_id) ON DELETE CASCADE
);