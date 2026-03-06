import { useState, useEffect } from "react";

export default function Productos() {
    // MODALS
    const [modal, setModal] = useState(false);
    const [modalUpdate, setModalUpdate] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);

    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null)

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(""); 

    // VARIANTS
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [seasons, setSeasons] = useState([]);

    // SELECTS
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSeason, setSelectedSeason] = useState(""); 
    
    // TIPO DE TALLE (ropa/calzado)
    const [sizeType, setSizeType] = useState('clothing');

    // INPUTS
    const [barcode, setBarcode] = useState("");
    const [name, setName] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [stock, setStock] = useState("");

    // PRODUCTS
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        getProducts();
    }, []);

    const getVariants = async () => {
        try {
        const [sizesRes, colorsRes, categoriesRes, seasonsRes] = await Promise.all([
            fetch("http://localhost:3000/sizes"),
            fetch("http://localhost:3000/colors"),
            fetch("http://localhost:3000/categories"),
            fetch("http://localhost:3000/seasons")
        ]);
        
        setSizes(await sizesRes.json());
        setColors(await colorsRes.json());
        setCategories(await categoriesRes.json());
        setSeasons(await seasonsRes.json());

        } catch (error) {
        console.error(error);
        }
    };

    const getProducts = async () => {
        try {
        const res = await fetch("http://localhost:3000/products");
        const data = await res.json();
        setProducts(data);
        } catch (error) {
        console.error(error);
        }
    };

    // Filtrar talles según tipo seleccionado
    const filteredSizes = sizes.filter(size => {
        if (sizeType === 'clothing') return size.type === 'clothing';
        if (sizeType === 'footwear') return size.type === 'footwear';
        if (sizeType === 'pants') return size.type === 'pants';
        return true;
    });

    const openModal = () => {
        setModal(true);
        getVariants();
    };

    const saveProduct = async () => {
        if (!barcode.trim()) return setError("Falta código de barras");
        if (!name.trim()) return setError("Falta nombre del producto");
        if (!selectedCategory) return setError("Seleccione una categoría");
        if (!costPrice) return setError("Falta precio de costo");
        if (!salePrice) return setError("Falta precio de venta");
        if (!stock) return setError("Falta stock");

        setError("");

        try {
            const res = await fetch("http://localhost:3000/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category_id: selectedCategory,
                    season_id: selectedSeason === "" ? null : Number(selectedSeason),
                    barcode,
                    size_id: selectedSize === "" ? null : Number(selectedSize),
                    color_id: selectedColor === "" ? null : Number(selectedColor),
                    stock: parseInt(stock),
                    cost_price: parseFloat(costPrice),
                    sale_price: parseFloat(salePrice)
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                setError(data.error);
                return;
            }

            setModal(false);
            setSuccessMessage("✅ Producto creado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);

            setBarcode("");
            setName("");
            setSelectedCategory("");
            setSelectedSize("");
            setSelectedColor("");
            setSelectedSeason("");
            setCostPrice("");
            setSalePrice("");
            setStock("");
            setError("");

            getProducts();

        } catch (error) {
            console.error(error);
            setError("Error al guardar: " + error.message);
        }
    };

    const cancelModal = () =>{
        setModal(false);
        setBarcode("");
        setName("");
        setSelectedCategory("");
        setSelectedSize("");
        setSelectedColor("");
        setSelectedSeason("");
        setCostPrice("");
        setSalePrice("");
        setStock("");
        setError("");
    }

    const openModalUpdate = (row) => {
        setEditData({
            variant_id: row.variant_id,
            product_id: row.product_id,
            barcode: row.barcode || "",
            name: row.product_name || "",
            category: row.category_id || "",
            season: row.season_id || "",
            size: row.size_id || "",
            color: row.color_id || "",
            cost: row.cost_price || "",
            sale: row.sale_price || "",
            stock: row.stock || "",
        });

        getVariants();
        setModalUpdate(true);
    };

    const updateProduct = async () => {
        try {
            const resProduct = await fetch(
                `http://localhost:3000/products/${editData.product_id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: editData.name,
                        category_id: editData.category,
                        season_id: editData.season === "" ? null : Number(editData.season),
                    }),
                }
            );

            const resVariant = await fetch(
                `http://localhost:3000/variants/${editData.variant_id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        size_id: editData.size === "" ? null : Number(editData.size),
                        color_id: editData.color === "" ? null : Number(editData.color),
                        stock: parseInt(editData.stock),
                        cost_price: parseFloat(editData.cost),
                        sale_price: parseFloat(editData.sale),
                    }),
                }
            );

            if (!resProduct.ok || !resVariant.ok) {
                console.log("Error al actualizar");
                return;
            }

            setModalUpdate(false);
            setEditData(null);
            setError("");
            setSuccessMessage("✅ Producto actualizado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
            getProducts();

        } catch (error) {
            console.error(error);
            setError("Error al actualizar");
        }
    };

    const deleteProduct = async () =>{
        try {
            await fetch(`http://localhost:3000/products/${deleteId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            setModalDelete(false);
            setSuccessMessage("✅ Producto eliminado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
            getProducts();
        } catch (error) {
            console.error(error);
            setError("Error al borrar");
        }
    }

    const filteredProducts = products.filter(product => {
        if (searchTerm.trim() === "") return true;
        
        const term = searchTerm.toLowerCase().trim();
        
        return (
            product.product_name?.toLowerCase().includes(term) ||
            product.barcode?.toLowerCase().includes(term) ||
            product.category?.toLowerCase().includes(term) ||
            product.season?.toLowerCase().includes(term) ||
            product.size_name?.toLowerCase().includes(term) ||
            product.color_name?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="container-fluid py-5 px-5 bg-white" style={{ minHeight: "100vh" }}>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h2 className="fw-bold text-dark mb-0">
                    <i className="bi bi-box-seam text-primary me-2 fs-3"></i>
                    Gestor de Productos
                </h2>
                <button className="btn btn-primary px-4 py-2" onClick={openModal}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo Producto
                </button>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show mb-3 border-0 shadow-sm" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <span className="fw-medium">{successMessage}</span>
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
                </div>
            )}

            {/* Buscador mejorado */}
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white">
                            <i className="bi bi-search text-secondary"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Buscar por nombre, código, categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                className="btn btn-outline-secondary" 
                                onClick={() => setSearchTerm("")}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>
                </div>
                <div className="col-md-6 text-end">
                    <span className="text-secondary">
                        <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                        {filteredProducts.length} productos
                    </span>
                </div>
            </div>

            {/* TABLA */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-dark fw-semibold">Nombre</th>
                                    <th className="py-3 text-dark fw-semibold">Categoría</th>
                                    <th className="py-3 text-dark fw-semibold">Código</th>
                                    <th className="py-3 text-dark fw-semibold">Compra</th>
                                    <th className="py-3 text-dark fw-semibold">Venta</th>
                                    <th className="py-3 text-dark fw-semibold">Stock</th>
                                    <th className="py-3 text-dark fw-semibold">Temporada</th>
                                    <th className="py-3 text-dark fw-semibold">Talle</th>
                                    <th className="py-3 text-dark fw-semibold">Color</th>
                                    <th className="py-3 text-end pe-4 text-dark fw-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(row => (
                                    <tr key={row.variant_id} className="border-bottom">
                                        <td className="px-4">
                                            <div className="fw-medium text-dark">{row.product_name}</div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark px-3 py-2 fw-normal">
                                                {row.category || "-"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-monospace text-primary">{row.barcode || "-"}</span>
                                        </td>
                                        <td className="text-secondary">${row.cost_price}</td>
                                        <td className="fw-medium text-success">${row.sale_price}</td>
                                        <td>
                                            <span className={`badge px-3 py-2 fw-medium ${
                                                row.stock >= 6 ? 'bg-success text-white' : 
                                                row.stock > 0 ? 'bg-warning text-dark' : 
                                                'bg-danger text-white'
                                            }`}>
                                                <i className={`bi ${
                                                    row.stock >= 6 ? 'bi-check-circle me-1' : 
                                                    row.stock > 0 ? 'bi-exclamation-triangle me-1' : 
                                                    'bi-x-circle me-1'
                                                }`}></i>
                                                {row.stock}
                                            </span>
                                        </td>
                                        <td className="text-secondary">{row.season || "-"}</td>
                                        <td className="text-secondary">{row.size_name || "-"}</td>
                                        <td>
                                            {row.color_name ? (
                                                <span className="d-flex align-items-center text-secondary">
                                                    {row.color_name}
                                                </span>
                                            ) : "-"}
                                        </td>
                                        <td className="text-end pe-4">
                                            <button 
                                                onClick={() => openModalUpdate(row)} 
                                                className="btn btn-sm btn-outline-warning border-0 me-2"
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil-square fs-5"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger border-0" 
                                                onClick={() => {
                                                    setDeleteId(row.product_id); 
                                                    setModalDelete(true);
                                                }}
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash3 fs-5"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-secondary d-block mb-3"></i>
                            <p className="text-secondary mb-0">No hay productos para mostrar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CREAR */}
            {modal && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="bi bi-plus-circle text-success me-2"></i>
                                    Nuevo Producto
                                </h5>
                                <button
                                    className="btn-close"
                                    onClick={() => { setModal(false); setError(""); }}
                                />
                            </div>

                            <div className="modal-body pt-3">
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="row g-4">
                                    {/* COLUMNA OBLIGATORIOS */}
                                    <div className="col-md-8">
                                        <h6 className="fw-semibold text-success mb-3">
                                            <i className="bi bi-asterisk me-2"></i>
                                            Campos obligatorios
                                        </h6>
                                        
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">
                                                    Código de barras *
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={barcode}
                                                    onChange={(e) => setBarcode(e.target.value)}
                                                    placeholder="Ingrese código"
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">
                                                    Nombre *
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Nombre del producto"
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">
                                                    Precio costo *
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={costPrice}
                                                    onChange={(e) => setCostPrice(e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">
                                                    Precio venta *
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={salePrice}
                                                    onChange={(e) => setSalePrice(e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">
                                                    Categoría *
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">
                                                    Stock *
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={stock}
                                                    onChange={(e) => setStock(e.target.value)}
                                                    placeholder="0"
                                                    type="number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA OPCIONALES */}
                                    <div className="col-md-4">
                                        <h6 className="fw-semibold text-secondary mb-3">
                                            <i className="bi bi-sliders2 me-2"></i>
                                            Opciones adicionales
                                        </h6>

                                        <div className="vstack gap-3">
                                            <div>
                                                <label className="form-label text-secondary small fw-medium">
                                                    Temporada
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={selectedSeason}
                                                    onChange={(e) => setSelectedSeason(e.target.value)}
                                                >
                                                    <option value="">Sin especificar</option>
                                                    {seasons.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <label className="form-label text-secondary small fw-medium mb-0">
                                                        Tipo de talle
                                                    </label>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                        type="button"
                                                        className={`btn ${sizeType === 'clothing' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setSizeType('clothing')}
                                                        >
                                                        Ropa
                                                        </button>
                                                        <button
                                                        type="button"
                                                        className={`btn ${sizeType === 'footwear' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setSizeType('footwear')}
                                                        >
                                                        Calzado
                                                        </button>
                                                        <button
                                                        type="button"
                                                        className={`btn ${sizeType === 'pants' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setSizeType('pants')}
                                                        >
                                                        Pantalón
                                                        </button>
                                                    </div>
                                                </div>
                                                <select
                                                    className="form-select"
                                                    value={selectedSize}
                                                    onChange={(e) => setSelectedSize(e.target.value)}
                                                >
                                                    <option value="">Sin especificar</option>
                                                    {filteredSizes.map(size => (
                                                        <option key={size.id} value={size.id}>{size.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="form-label text-secondary small fw-medium">
                                                    Color
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={selectedColor}
                                                    onChange={(e) => setSelectedColor(e.target.value)}
                                                >
                                                    <option value="">Sin especificar</option>
                                                    {colors.map(color => (
                                                        <option key={color.id} value={color.id}>{color.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-0 pt-0">
                                <button className="btn btn-light px-4" onClick={cancelModal}>
                                    Cancelar
                                </button>
                                <button className="btn btn-success px-4" onClick={saveProduct}>
                                    <i className="bi bi-check-circle me-2"></i>
                                    Guardar Producto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

           {/* MODAL UPDATE */}
            {modalUpdate && editData && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="bi bi-pencil-square text-warning me-2"></i>
                                    Actualizar Producto
                                </h5>
                                <button
                                    className="btn-close"
                                    onClick={() => {
                                        setModalUpdate(false);
                                        setEditData(null);
                                        setError("");
                                    }}
                                />
                            </div>

                            <div className="modal-body pt-3">
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="row g-4">
                                    <div className="col-md-8">
                                        <h6 className="fw-semibold text-success mb-3">
                                            <i className="bi bi-asterisk me-2"></i>
                                            Campos obligatorios
                                        </h6>
                                        
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">Código de barras</label>
                                                <input
                                                    className="form-control"
                                                    value={editData.barcode}
                                                    disabled
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">Nombre *</label>
                                                <input
                                                    className="form-control"
                                                    value={editData.name}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, name: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">Categoría *</label>
                                                <select
                                                    className="form-select"
                                                    value={editData.category}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, category: e.target.value })
                                                    }
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">Precio costo *</label>
                                                <input
                                                    className="form-control"
                                                    value={editData.cost}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, cost: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">Precio venta *</label>
                                                <input
                                                    className="form-control"
                                                    value={editData.sale}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, sale: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-medium">Stock *</label>
                                                <input
                                                    className="form-control"
                                                    value={editData.stock}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, stock: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <h6 className="fw-semibold text-secondary mb-3">
                                            <i className="bi bi-sliders2 me-2"></i>
                                            Opciones adicionales
                                        </h6>

                                        <div className="vstack gap-3">
                                            <div>
                                                <label className="form-label text-secondary small fw-medium">Temporada</label>
                                                <select
                                                    className="form-select"
                                                    value={editData.season}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, season: e.target.value })
                                                    }
                                                >
                                                    <option value="">Sin especificar</option>
                                                    {seasons.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="form-label text-secondary small fw-medium mb-2">Talle</label>
                                                
                                                {/* Primero, obtenemos el tipo del talle actual */}
                                                {(() => {
                                                    const talleActual = sizes.find(s => s.id === Number(editData.size));
                                                    const tipoTalle = talleActual?.type || 'clothing';
                                                    
                                                    return (
                                                        <>
                                                            <div className="mb-2">
                                                                <span className="badge bg-light text-dark border px-3 py-2">
                                                                    Tipo: {
                                                                        tipoTalle === 'clothing' ? 'Ropa' :
                                                                        tipoTalle === 'footwear' ? 'Calzado' :
                                                                        'Pantalón'
                                                                    }
                                                                </span>
                                                            </div>
                                                            <select
                                                                className="form-select"
                                                                value={editData.size}
                                                                onChange={(e) =>
                                                                    setEditData({ ...editData, size: e.target.value })
                                                                }
                                                            >
                                                                <option value="">Sin especificar</option>
                                                                {sizes
                                                                    .filter(size => size.type === tipoTalle)
                                                                    .map(size => (
                                                                        <option key={size.id} value={size.id}>
                                                                            {size.name}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            <div>
                                                <label className="form-label text-secondary small fw-medium">Color</label>
                                                <select
                                                    className="form-select"
                                                    value={editData.color}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, color: e.target.value })
                                                    }
                                                >
                                                    <option value="">Sin especificar</option>
                                                    {colors.map(color => (
                                                        <option key={color.id} value={color.id}>{color.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-0 pt-0">
                                <button
                                    className="btn btn-light px-4"
                                    onClick={() => {
                                        setModalUpdate(false);
                                        setEditData(null);
                                        setError("");
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button className="btn btn-warning px-4" onClick={updateProduct}>
                                    <i className="bi bi-check-circle me-2"></i>
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DELETE */}
            {modalDelete && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Confirmar
                                </h5>
                                <button
                                    className="btn-close btn-close-white"
                                    onClick={() => setModalDelete(false)}
                                />
                            </div>
                            <div className="modal-body text-center p-4">
                                <i className="bi bi-trash3 fs-1 text-danger mb-3 d-block"></i>
                                <p className="text-dark mb-0">¿Seguro que querés borrar este producto?</p>
                            </div>
                            <div className="modal-footer border-0">
                                <button
                                    className="btn btn-light"
                                    onClick={() => setModalDelete(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={deleteProduct}
                                >
                                    <i className="bi bi-trash3 me-2"></i>
                                    Borrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}