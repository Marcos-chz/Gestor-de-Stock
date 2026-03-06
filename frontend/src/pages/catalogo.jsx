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
      
      const catData = await catRes.json();
      const sizeData = await sizeRes.json();
      const colData = await colRes.json();
      const seaData = await seaRes.json();
      
      setCategories(catData);
      setSizes(sizeData);
      setColors(colData);
      setSeasons(seaData);
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    
    let url = '';
    let body = { name: newName };
    
    if (activeTab === 'talles') {
      url = 'http://localhost:3000/sizes';
      body = { name: newName, type: sizeType };
      console.log('📤 Enviando talle:', body);
    } else if (activeTab === 'categorias') {
      url = 'http://localhost:3000/categories';
    } else if (activeTab === 'colores') {
      url = 'http://localhost:3000/colors';
    } else if (activeTab === 'temporadas') {
      url = 'http://localhost:3000/seasons';
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Error del servidor:', error);
        alert(`Error: ${error.error || 'No se pudo guardar'}`);
        return;
      }
      
      setNewName('');
      loadData();
    } catch (error) {
      console.error('Error de red:', error);
      alert('Error de conexión con el servidor');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    let url = '';
    if (activeTab === 'talles') {
      url = `http://localhost:3000/sizes/${id}`;
    } else if (activeTab === 'categorias') {
      url = `http://localhost:3000/categories/${id}`;
    } else if (activeTab === 'colores') {
      url = `http://localhost:3000/colors/${id}`;
    } else if (activeTab === 'temporadas') {
      url = `http://localhost:3000/seasons/${id}`;
    }

    try {
      const res = await fetch(url, { method: 'DELETE' });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo eliminar'}`);
        return;
      }
      
      loadData();
    } catch (error) {
      console.error('Error de red:', error);
      alert('Error de conexión con el servidor');
    }
  };

  // Filtrar talles según tipo seleccionado
  const filteredSizes = sizes.filter(size => {
    if (sizeType === 'clothing') return size.type === 'clothing';
    if (sizeType === 'footwear') return size.type === 'footwear';
    if (sizeType === 'pants') return size.type === 'pants';
    return true;
  });

  return (
    <div className="container-fluid py-5 px-5 bg-white" style={{ minHeight: "100vh" }}>
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
          
          {/* Formulario para agregar */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold text-secondary">
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo {activeTab === 'categorias' ? 'categoría' : 
                       activeTab === 'talles' ? 'talle' :
                       activeTab === 'colores' ? 'color' : 'temporada'}
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`Nombre del ${activeTab === 'categorias' ? 'categoría' : 
                    activeTab === 'talles' ? 'talle' :
                    activeTab === 'colores' ? 'color' : 'temporada'}`}
                />
                <button className="btn btn-success" onClick={addItem}>
                  <i className="bi bi-plus-lg me-2"></i>
                  Agregar
                </button>
              </div>
            </div>
            
            {/* Selector de tipo de talle (solo en pestaña talles) */}
            {activeTab === 'talles' && (
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary mb-2">Tipo de talle</label>
                <div className="d-flex gap-2 flex-wrap">
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
                  <button
                    className={`btn ${sizeType === 'pants' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSizeType('pants')}
                  >
                    <i className="bi bi-person-standing-dress me-2"></i>
                    Pantalón
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Listado de items */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-dark fw-semibold">Nombre</th>
                  {activeTab === 'talles' && (
                    <th className="py-3 text-dark fw-semibold">Tipo</th>
                  )}
                  <th className="py-3 text-end pe-4 text-dark fw-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'talles' ? (
                  filteredSizes.length > 0 ? (
                    filteredSizes.map(item => (
                      <tr key={item.id} className="border-bottom">
                        <td className="px-4 fw-medium text-dark">{item.name}</td>
                        <td>
                          <span className="text-secondary">
                            {item.type === 'clothing' ? 'Ropa' :
                             item.type === 'footwear' ? 'Calzado' :
                             'Pantalón'}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button 
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => deleteItem(item.id)}
                          >
                            <i className="bi bi-trash3 fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-secondary">
                        <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                        No hay talles de este tipo
                      </td>
                    </tr>
                  )
                ) : (
                  (activeTab === 'categorias' ? categories :
                   activeTab === 'colores' ? colors :
                   seasons).map(item => (
                    <tr key={item.id} className="border-bottom">
                      <td className="px-4 fw-medium text-dark">{item.name}</td>
                      <td className="text-end pe-4">
                        <button 
                          className="btn btn-sm btn-outline-danger border-0"
                          onClick={() => deleteItem(item.id)}
                        >
                          <i className="bi bi-trash3 fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
                {activeTab !== 'talles' && (
                  (activeTab === 'categorias' ? categories.length === 0 :
                   activeTab === 'colores' ? colors.length === 0 :
                   seasons.length === 0) && (
                    <tr>
                      <td colSpan="2" className="text-center py-4 text-secondary">
                        <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                        No hay {activeTab} para mostrar
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}