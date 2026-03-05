import { useState, useEffect } from "react";

export default function AdministrarCatalogo() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [seasons, setSeasons] = useState([]);
  
  const [newName, setNewName] = useState('');
  const [sizeType, setSizeType] = useState('clothing'); 


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, sizeRes, colRes, seaRes] = await Promise.all([
        fetch('http://localhost:3000/categories'),
        fetch('http://localhost:3000/sizes'),
        fetch('http://localhost:3000/colors'),
        fetch('http://localhost:3000/seasons')
      ]);
      
      setCategories(await catRes.json());
      setSizes(await sizeRes.json());
      setColors(await colRes.json());
      setSeasons(await seaRes.json());
    } catch (error) {
      console.error(error);
    }
  };

  const addItem = async () => {
    if (!newName.trim() || activeTab === 'talles') return;
    
    let url = '';
    if (activeTab === 'categorias') url = 'http://localhost:3000/categories';
    if (activeTab === 'colores') url = 'http://localhost:3000/colors';
    if (activeTab === 'temporadas') url = 'http://localhost:3000/seasons';

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      setNewName('');
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteItem = async (id) => {
    if (activeTab === 'talles') return;
    
    let url = '';
    if (activeTab === 'categorias') url = `http://localhost:3000/categories/${id}`;
    if (activeTab === 'colores') url = `http://localhost:3000/colors/${id}`;
    if (activeTab === 'temporadas') url = `http://localhost:3000/seasons/${id}`;

    try {
      await fetch(url, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // Talles fijos
  const tallesRopa = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];
  const tallesCalzado = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43'];

  const filteredSizes = sizeType === 'clothing' ? tallesRopa : tallesCalzado;

  return (
    <div className="container-fluid py-4 px-4 bg-white" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h2 className="fw-bold text-dark mb-0">
          <i className="bi bi-gear-wide-connected text-primary me-2 fs-3"></i>
          Administrar Catálogo
        </h2>
      </div>

      {/* Pestañas */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'categorias' ? 'active fw-semibold' : 'text-secondary'}`}
            onClick={() => setActiveTab('categorias')}
          >
            <i className="bi bi-tags me-2"></i>Categorías
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'talles' ? 'active fw-semibold' : 'text-secondary'}`}
            onClick={() => setActiveTab('talles')}
          >
            <i className="bi bi-rulers me-2"></i>Talles
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'colores' ? 'active fw-semibold' : 'text-secondary'}`}
            onClick={() => setActiveTab('colores')}
          >
            <i className="bi bi-palette me-2"></i>Colores
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'temporadas' ? 'active fw-semibold' : 'text-secondary'}`}
            onClick={() => setActiveTab('temporadas')}
          >
            <i className="bi bi-calendar me-2"></i>Temporadas
          </button>
        </li>
      </ul>

      {/* Contenido según pestaña */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          
          {/* SECCIÓN TALLES */}
          {activeTab === 'talles' ? (
            <>
              <div className="row mb-4">
                <div className="col-12">
                  <label className="form-label fw-semibold text-secondary mb-2">Tipo de talle</label>
                  <div className="d-flex gap-2">
                    <button
                      className={`btn ${sizeType === 'clothing' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSizeType('clothing')}
                    >
                      <i className="bi bi-person me-2"></i>
                      Ropa
                    </button>
                    <button
                      className={`btn ${sizeType === 'footwear' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSizeType('footwear')}
                    >
                      <i className="bi bi-foot me-2"></i>
                      Calzado
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h6 className="fw-semibold text-secondary mb-3">
                  <i className="bi bi-list-ul me-2"></i>
                  Talles de {sizeType === 'clothing' ? 'ropa' : 'calzado'} disponibles
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {filteredSizes.map((talle, index) => (
                    <span key={index} className="badge bg-light text-dark px-3 py-2 border rounded-3">
                      {talle}
                    </span>
                  ))}
                </div>
                <p className="text-secondary mt-3 small">
                  <i className="bi bi-info-circle me-1"></i>
                  Estos talles son fijos y no se pueden modificar.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Formulario para agregar */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-secondary">
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo {activeTab === 'categorias' ? 'categoría' : 
                           activeTab === 'colores' ? 'color' : 'temporada'}
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={`Nombre del ${activeTab === 'categorias' ? 'categoría' : 
                        activeTab === 'colores' ? 'color' : 'temporada'}`}
                    />
                    <button className="btn btn-success" onClick={addItem}>
                      <i className="bi bi-plus-lg me-2"></i>
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Listado de items */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3 text-dark fw-semibold">ID</th>
                      <th className="py-3 text-dark fw-semibold">Nombre</th>
                      <th className="py-3 text-end pe-4 text-dark fw-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'categorias' ? categories :
                      activeTab === 'colores' ? colors :
                      seasons).map(item => (
                      <tr key={item.id} className="border-bottom">
                        <td className="px-4 text-secondary">{item.id}</td>
                        <td className="fw-medium text-dark">{item.name}</td>
                        <td className="text-end pe-4">
                          <button 
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => deleteItem(item.id)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash3 fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(activeTab === 'categorias' ? categories.length === 0 :
                      activeTab === 'colores' ? colors.length === 0 :
                      seasons.length === 0) && (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-secondary">
                          <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                          No hay {activeTab} para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}