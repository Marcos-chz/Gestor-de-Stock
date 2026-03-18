PRAGMA foreign_keys = ON;

-- ======================
-- CATEGORÍAS
-- ======================
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1
);
CREATE UNIQUE INDEX idx_categories_name_active ON categories(name) WHERE active = 1;

-- ======================
-- TALLES
-- ======================
CREATE TABLE sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'clothing',  -- 'clothing', 'footwear', 'pants'
    active INTEGER DEFAULT 1
);
CREATE UNIQUE INDEX idx_sizes_name_type_active ON sizes(name, type) WHERE active = 1;

-- ======================
-- COLORES
-- ======================
CREATE TABLE colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1
);
CREATE UNIQUE INDEX idx_colors_name_active ON colors(name) WHERE active = 1;

-- ======================
-- TEMPORADAS
-- ======================
CREATE TABLE seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active INTEGER DEFAULT 1
);  
CREATE UNIQUE INDEX idx_seasons_name_active ON seasons(name) WHERE active = 1;

-- ======================
-- PRODUCTOS (modelo general)
-- ======================
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    season_id INTEGER,
    active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (season_id) REFERENCES seasons(id)
);

-- ======================
-- VARIANTES (artículo vendible real)
-- ======================
CREATE TABLE variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    barcode TEXT UNIQUE,
    size_id INTEGER,
    color_id INTEGER,
    stock INTEGER DEFAULT 0,    
    cost_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(id),
    FOREIGN KEY (color_id) REFERENCES colors(id)
);

-- ======================
-- MOVIMIENTOS DE STOCK
-- ======================
CREATE TABLE stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('purchase','sale','adjustment','loss','initial')),
    quantity INTEGER NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
);

-- ======================
-- VENTAS (boleta encabezado)
-- ======================
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    card_surcharge REAL DEFAULT 0,
    total REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash','card', 'wallet'))
);

-- ======================
-- ITEMS DE VENTA
-- ======================
CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    commission_pct REAL DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
);

-- ======================
-- REGLAS DE PAGO (por método)
-- ======================
CREATE TABLE payment_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metodo TEXT NOT NULL UNIQUE,        
    descuento REAL DEFAULT 0,           
    recargo REAL DEFAULT 0,              
    activo BOOLEAN DEFAULT 1,            
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar métodos por defecto
INSERT INTO payment_rules (metodo, descuento, recargo, activo) VALUES 
    ('efectivo', 0, 0, 1),
    ('tarjeta', 0, 0, 1),
    ('billetera', 0, 0, 1);


-- ======================
-- CATEGORÍAS BÁSICAS
-- ======================
INSERT INTO categories (name) VALUES 
    ('Remeras'),
    ('Pantalones'),
    ('Calzado'),
    ('Camperas'),
    ('Accesorios');

-- Talles de ropa
INSERT INTO sizes (name, type) VALUES 
    ('XS', 'clothing'),
    ('S', 'clothing'),
    ('M', 'clothing'),
    ('L', 'clothing'),
    ('XL', 'clothing'),
    ('XXL', 'clothing'),
    ('Único', 'clothing');

-- Talles de calzado
INSERT INTO sizes (name, type) VALUES 
    ('33', 'footwear'),
    ('34', 'footwear'),
    ('35', 'footwear'),
    ('36', 'footwear'),
    ('37', 'footwear'),
    ('38', 'footwear'),
    ('39', 'footwear'),
    ('40', 'footwear'),
    ('41', 'footwear'),
    ('42', 'footwear'),
    ('43', 'footwear');

-- Talles de pantalón (34 al 56 pares)
INSERT INTO sizes (name, type) VALUES 
    ('34', 'pants'),
    ('36', 'pants'),
    ('38', 'pants'),
    ('40', 'pants'),
    ('42', 'pants'),
    ('44', 'pants'),
    ('46', 'pants'),
    ('48', 'pants'),
    ('50', 'pants'),
    ('52', 'pants'),
    ('54', 'pants'),
    ('56', 'pants');

-- ======================
-- COLORES BÁSICOS
-- ======================
INSERT INTO colors (name) VALUES 
    ('Blanco'),
    ('Negro'),
    ('Rojo'),
    ('Azul');

-- ======================
-- TEMPORADAS BÁSICAS
-- ======================
INSERT INTO seasons (name) VALUES 
    ('Verano'),
    ('Invierno');