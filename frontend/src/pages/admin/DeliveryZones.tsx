import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeliveryZone {
  id: number;
  name: string;
  color: string;
  deliveryFee: number;
  minOrder: number;
  estimatedTime: string;
  active: boolean;
}

const DeliveryZones: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<DeliveryZone[]>([
    { id: 1, name: 'Центр', color: '#4caf50', deliveryFee: 500, minOrder: 3000, estimatedTime: '30-40 мин', active: true },
    { id: 2, name: 'Алматинский район', color: '#2196f3', deliveryFee: 800, minOrder: 4000, estimatedTime: '40-50 мин', active: true },
    { id: 3, name: 'Есильский район', color: '#ff9800', deliveryFee: 1000, minOrder: 5000, estimatedTime: '50-60 мин', active: false },
  ]);

  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);

  const handleToggleZone = (id: number) => {
    setZones(zones.map(zone => 
      zone.id === id ? { ...zone, active: !zone.active } : zone
    ));
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setShowZoneModal(true);
  };

  const handleAddZone = () => {
    setEditingZone({
      id: Date.now(),
      name: '',
      color: '#667eea',
      deliveryFee: 500,
      minOrder: 3000,
      estimatedTime: '30-40 мин',
      active: true,
    });
    setShowZoneModal(true);
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    if (zones.find(z => z.id === editingZone.id)) {
      setZones(zones.map(z => z.id === editingZone.id ? editingZone : z));
    } else {
      setZones([...zones, editingZone]);
    }
    setShowZoneModal(false);
    setEditingZone(null);
  };

  const handleDeleteZone = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту зону доставки?')) {
      setZones(zones.filter(z => z.id !== id));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Зоны доставки</h1>
          <p className="admin-page-subtitle">Управление картой и зонами доставки</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddZone}>
          + Добавить зону
        </button>
      </div>

      <div className="delivery-zones-layout">
        {/* Map Preview */}
        <div className="delivery-zones-map">
          <div className="zones-map-container">
            <div className="zones-map-canvas">
              <div className="zones-map-bg"></div>
              {zones.filter(z => z.active).map((zone) => (
                <div
                  key={zone.id}
                  className="zone-overlay"
                  style={{
                    background: `radial-gradient(circle, ${zone.color}40, transparent)`,
                    width: `${200 + zone.id * 80}px`,
                    height: `${200 + zone.id * 80}px`,
                    top: `${20 + zone.id * 10}%`,
                    left: `${30 + zone.id * 5}%`,
                  }}
                >
                  <div className="zone-label" style={{ color: zone.color }}>
                    {zone.name}
                  </div>
                </div>
              ))}
              <div className="map-center-marker">📍</div>
            </div>
            <div className="zones-map-hint">
              Визуализация зон доставки (интеграция с картами в разработке)
            </div>
          </div>
        </div>

        {/* Zones List */}
        <div className="delivery-zones-list">
          <h3 className="zones-list-title">Активные зоны</h3>
          
          {zones.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <p>Нет зон доставки</p>
              <button className="btn btn-secondary" onClick={handleAddZone}>
                Создать первую зону
              </button>
            </div>
          ) : (
            <div className="zones-cards">
              {zones.map((zone) => (
                <div key={zone.id} className={`zone-card ${!zone.active ? 'zone-inactive' : ''}`}>
                  <div className="zone-card-header">
                    <div className="zone-color-indicator" style={{ background: zone.color }}></div>
                    <h4 className="zone-card-name">{zone.name}</h4>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={zone.active}
                        onChange={() => handleToggleZone(zone.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="zone-card-body">
                    <div className="zone-info-row">
                      <span className="zone-info-label">Стоимость доставки:</span>
                      <span className="zone-info-value">{zone.deliveryFee} ₸</span>
                    </div>
                    <div className="zone-info-row">
                      <span className="zone-info-label">Минимальный заказ:</span>
                      <span className="zone-info-value">{zone.minOrder} ₸</span>
                    </div>
                    <div className="zone-info-row">
                      <span className="zone-info-label">Время доставки:</span>
                      <span className="zone-info-value">{zone.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="zone-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditZone(zone)}
                    >
                      Изменить
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone Edit Modal */}
      {showZoneModal && editingZone && (
        <div className="modal-overlay" onClick={() => setShowZoneModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {zones.find(z => z.id === editingZone.id) ? 'Редактировать зону' : 'Новая зона доставки'}
              </h2>
              <button className="modal-close" onClick={() => setShowZoneModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveZone}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Название зоны *</label>
                  <input
                    type="text"
                    value={editingZone.name}
                    onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                    placeholder="Центр, Алматинский район..."
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Цвет зоны</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={editingZone.color}
                      onChange={(e) => setEditingZone({ ...editingZone, color: e.target.value })}
                      style={{ width: '60px', height: '40px', borderRadius: '8px', border: '2px solid var(--border-color)' }}
                    />
                    <input
                      type="text"
                      value={editingZone.color}
                      onChange={(e) => setEditingZone({ ...editingZone, color: e.target.value })}
                      placeholder="#667eea"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Стоимость доставки (₸) *</label>
                    <input
                      type="number"
                      value={editingZone.deliveryFee}
                      onChange={(e) => setEditingZone({ ...editingZone, deliveryFee: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Минимальный заказ (₸) *</label>
                    <input
                      type="number"
                      value={editingZone.minOrder}
                      onChange={(e) => setEditingZone({ ...editingZone, minOrder: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Время доставки *</label>
                  <input
                    type="text"
                    value={editingZone.estimatedTime}
                    onChange={(e) => setEditingZone({ ...editingZone, estimatedTime: e.target.value })}
                    placeholder="30-40 мин"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingZone.active}
                      onChange={(e) => setEditingZone({ ...editingZone, active: e.target.checked })}
                    />
                    <span>Активная зона</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowZoneModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryZones;
