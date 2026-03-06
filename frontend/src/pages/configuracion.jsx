import { useState, useEffect } from "react";

export default function Configuracion() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false);

    // Estados solo para efectivo y tarjeta
    const [efectivo, setEfectivo] = useState({
        descuento: 0,
        activo: true
    });
    
    const [tarjeta, setTarjeta] = useState({
        recargo: 0,
        activo: true
    });

    // Guardar valores originales para comparar
    const [originalEfectivo, setOriginalEfectivo] = useState({ descuento: 0, activo: true });
    const [originalTarjeta, setOriginalTarjeta] = useState({ recargo: 0, activo: true });

    // Cargar configuración actual
    useEffect(() => {
        getConfiguracion();
    }, []);

    // Detectar cambios comparando con valores originales
    useEffect(() => {
        const efectivoCambio = efectivo.descuento !== originalEfectivo.descuento || 
                               efectivo.activo !== originalEfectivo.activo;
        const tarjetaCambio = tarjeta.recargo !== originalTarjeta.recargo || 
                              tarjeta.activo !== originalTarjeta.activo;
        
        setCambiosSinGuardar(efectivoCambio || tarjetaCambio);
    }, [efectivo, tarjeta, originalEfectivo, originalTarjeta]);

    const getConfiguracion = async () => {
        try {
            const res = await fetch("http://localhost:3000/payment_rules");
            const data = await res.json();
            
            if (Array.isArray(data)) {
                data.forEach(regla => {
                    if (regla.metodo === 'efectivo') {
                        const efectivoData = { descuento: regla.descuento, activo: regla.activo };
                        setEfectivo(efectivoData);
                        setOriginalEfectivo(efectivoData);
                    } else if (regla.metodo === 'tarjeta') {
                        const tarjetaData = { recargo: regla.recargo, activo: regla.activo };
                        setTarjeta(tarjetaData);
                        setOriginalTarjeta(tarjetaData);
                    }
                });
            }
            
            setLoading(false);
        } catch (error) {
            console.error(error);
            setError("Error al cargar configuración");
            setLoading(false);
        }
    };

    const guardarConfiguracion = async () => {
        setSaving(true);
        setError("");
        setSuccessMessage("");
        
        try {
            const configuracion = [
                { metodo: 'efectivo', descuento: efectivo.descuento, recargo: 0, activo: efectivo.activo },
                { metodo: 'tarjeta', descuento: 0, recargo: tarjeta.recargo, activo: tarjeta.activo }
            ];
            
            const res = await fetch("http://localhost:3000/payment_rules/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(configuracion)
            });
            
            if (!res.ok) throw new Error("Error al guardar");
            
            setSuccessMessage("✅ Configuración guardada correctamente");
            
            // Actualizar originales después de guardar
            setOriginalEfectivo({ descuento: efectivo.descuento, activo: efectivo.activo });
            setOriginalTarjeta({ recargo: tarjeta.recargo, activo: tarjeta.activo });
            setCambiosSinGuardar(false);
            
            setTimeout(() => setSuccessMessage(""), 3000);
            
        } catch (error) {
            console.error(error);
            setError("Error al guardar configuración");
        } finally {
            setSaving(false);
        }
    };

    const restablecerValores = () => {
        setEfectivo(originalEfectivo);
        setTarjeta(originalTarjeta);
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="container py-5 px-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">
                    <i className="bi bi-gear-fill me-2"></i>
                    Configuración de Pagos
                </h2>

                {cambiosSinGuardar && (
                    <div className="d-flex align-items-center">
                        <span className="text-warning me-2">
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                            Cambios sin guardar
                        </span>
                    </div>
                )}
            </div>

            {/* Mensajes */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
            )}
            
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {successMessage}
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
                </div>
            )}

            {/* Métodos de Pago */}
            <div className="row g-4">
                {/* Efectivo */}
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">
                                <i className="bi bi-cash text-success me-2"></i>
                                Efectivo
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Descuento por pago en efectivo</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={efectivo.descuento || ''}
                                        onChange={(e) => setEfectivo({ 
                                            ...efectivo, 
                                            descuento: e.target.value === '' ? 0 : Number(e.target.value) 
                                        })}
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="Sin descuento"
                                    />
                                    {efectivo.descuento > 0 && (
                                        <button 
                                            className="btn btn-outline-danger" 
                                            type="button"
                                            onClick={() => setEfectivo({ ...efectivo, descuento: 0 })}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    )}
                                    <span className="input-group-text">%</span>
                                </div>
                                <small className="text-muted">
                                    Descuento aplicado al total cuando paga en efectivo
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta */}
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">
                                <i className="bi bi-credit-card text-primary me-2"></i>
                                Tarjeta
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Recargo por pago con tarjeta</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={tarjeta.recargo || ''}
                                        onChange={(e) => setTarjeta({ 
                                            ...tarjeta, 
                                            recargo: e.target.value === '' ? 0 : Number(e.target.value) 
                                        })}
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="Sin recargo"
                                    />
                                    {tarjeta.recargo > 0 && (
                                        <button 
                                            className="btn btn-outline-danger" 
                                            type="button"
                                            onClick={() => setTarjeta({ ...tarjeta, recargo: 0 })}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    )}
                                    <span className="input-group-text">%</span>
                                </div>
                                <small className="text-muted">
                                    Recargo aplicado al total cuando paga con tarjeta
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-4 d-flex justify-content-end gap-2">
                <button 
                    className="btn btn-secondary"
                    onClick={restablecerValores}
                    disabled={!cambiosSinGuardar}
                >
                    Restablecer
                </button>
                <button 
                    className="btn btn-primary"
                    onClick={guardarConfiguracion}
                    disabled={saving || !cambiosSinGuardar}
                >
                    {saving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-circle me-2"></i>
                            Guardar Configuración
                        </>
                    )}
                </button>
            </div>

            {/* Vista previa */}
            <div className="card mt-4 bg-light">
                <div className="card-body">
                    <h6 className="fw-bold">Vista previa (ejemplo con $1000)</h6>
                    <div className="row mt-3">
                        <div className="col-md-6">
                            <div className="border rounded p-3 bg-white">
                                <small>Efectivo</small>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="h5 mb-0">$1000</span>
                                    <span className="badge bg-success">-{efectivo.descuento}%</span>
                                </div>
                                <strong className="text-success">
                                    Total: ${(1000 * (1 - efectivo.descuento/100)).toFixed(2)}
                                </strong>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="border rounded p-3 bg-white">
                                <small>Tarjeta</small>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="h5 mb-0">$1000</span>       
                                    <span className="badge bg-warning">+{tarjeta.recargo}%</span>
                                </div>
                                <strong className="text-warning">
                                    Total: ${(1000 * (1 + tarjeta.recargo/100)).toFixed(2)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}