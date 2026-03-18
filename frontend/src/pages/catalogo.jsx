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
  }, [activeTab, sizeType]);

  const loadData = async () => {
    try {
      if (activeTab === 'categorias') {
        const res = await fetch('http://localhost:3000/categories?active=1');
        setCategories(await res.json());
      } else if (activeTab === 'talles') {
        const res = await fetch(`http://localhost:3000/sizes?active=1&type=${sizeType}`);
        setSizes(await res.json());
      } else if (activeTab === 'colores') {
        const res = await fetch('http://localhost:3000/colors?active=1');
        setColors(await res.json());
      } else if (activeTab === 'temporadas') {
        const res = await fetch('http://localhost:3000/seasons?active=1');
        setSeasons(await res.json());
      }
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

  // "Eliminar" = desactivar (soft delete)
  const deleteItem = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    let url = '';
    if (activeTab === 'talles') {
      url = `http://localhost:3000/sizes/${id}/deactivate`;
    } else if (activeTab === 'categorias') {
      url = `http://localhost:3000/categories/${id}/deactivate`;
    } else if (activeTab === 'colores') {
      url = `http://localhost:3000/colors/${id}/deactivate`;
    } else if (activeTab === 'temporadas') {
      url = `http://localhost:3000/seasons/${id}/deactivate`;
    }

    try {
      const res = await fetch(url, { method: 'PATCH' });
      
      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo eliminar'}`);
        return;
      }
      
      loadData(); // Recargar (el elemento ya no aparece)
    } catch (error) {
      console.error('Error de red:', error);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="container-fluid py-5 px-5 bg-white" style={{ minHeight: "100vh" }}>
      {/* Header simple */}
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

      {/* Contenido */}
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
                  placeholder={`Nombre...`}
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                />
                <button className="btn btn-success" onClick={addItem}>
                  <i className="bi bi-plus-lg me-2"></i>
                  Agregar
                </button>
              </div>
            </div>
            
            {/* Selector de tipo de talle */}
            {activeTab === 'talles' && (
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary mb-2">Tipo de talle</label>
                <div className="d-flex gap-2 flex-wrap">

                <button
                    className={`btn ${sizeType === 'clothing' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSizeType('clothing')}
                >
                    Ropa
                </button>

                <button
                    className={`btn ${sizeType === 'pants' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSizeType('pants')}
                >
                    Pantalón
                </button>

                <button
                    className={`btn ${sizeType === 'footwear' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSizeType('footwear')}
                >
                    Calzado
                </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de items */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  {activeTab === 'talles' && <th className="py-3">Tipo</th>}
                  <th className="py-3 text-end pe-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'talles' && renderSizes(sizes, deleteItem)}
                {activeTab === 'categorias' && renderItems(categories, deleteItem)}
                {activeTab === 'colores' && renderColors(colors, deleteItem)}
                {activeTab === 'temporadas' && renderItems(seasons, deleteItem)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Funciones auxiliares para renderizar
function renderSizes(sizes, deleteItem) {
  if (sizes.length === 0) {
    return (
      <tr>
        <td colSpan="3" className="text-center py-4 text-secondary">
          <i className="bi bi-inbox fs-4 d-block mb-2"></i>
          No hay talles
        </td>
      </tr>
    );
  }

  return sizes.map(item => (
    <tr key={item.id} className="border-bottom">
      <td className="px-4 fw-medium">{item.name}</td>
      <td>
        <span className="badge text-dark px-3 py-2 fw-normal fs-6">
            {item.type === 'clothing' ? 'Ropa' :
            item.type === 'footwear' ? 'Calzado' : 'Pantalón'}
        </span>
      </td>
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
  ));
}

function renderColors(colors, deleteItem) {
  if (colors.length === 0) {
    return (
      <tr>
        <td colSpan="2" className="text-center py-4 text-secondary">
          <i className="bi bi-inbox fs-4 d-block mb-2"></i>
          No hay colores
        </td>
      </tr>
    );
  }

  return colors.map(item => (
    <tr key={item.id} className="border-bottom">
      <td className="px-4 fw-medium">
        <span className="d-flex align-items-center gap-2">
          {item.name}
        </span>
      </td>
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
  ));
}

function renderItems(items, deleteItem) {
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan="2" className="text-center py-4 text-secondary">
          <i className="bi bi-inbox fs-4 d-block mb-2"></i>
          No hay elementos
        </td>
      </tr>
    );
  }

  return items.map(item => (
    <tr key={item.id} className="border-bottom">
      <td className="px-4 fw-medium">{item.name}</td>
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
  ));
}