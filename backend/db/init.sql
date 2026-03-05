PRAGMA foreign_keys = ON;

-- ======================
-- CATEGORÍAS
-- ======================
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- ======================
-- TALLES
-- ======================
CREATE TABLE sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- ======================
-- COLORES
-- ======================
CREATE TABLE colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);


-- ======================
-- TEMPORADAS
-- ======================
CREATE TABLE seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);  

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

-- ======================
-- TALLES DE ROPA
-- ======================
INSERT INTO sizes (name) VALUES 
    ('XS'),
    ('S'),
    ('M'),
    ('L'),
    ('XL'),
    ('XXL'),
    ('Único');

-- ======================
-- TALLES DE CALZADO (Argentina - único para todos)
-- ======================
INSERT INTO sizes (name) VALUES 
    ('33'), ('34'), ('35'), ('36'), ('37'), 
    ('38'), ('39'), ('40'), ('41'), ('42'), 
    ('43');

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