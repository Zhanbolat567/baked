import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TwoGisMap from '../../components/admin/TwoGisMap';
import TwoGisEditorMap from '../../components/admin/TwoGisEditorMap';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';

interface DeliveryZone {
  id: number;
  name: string;
  color: string;
  coordinates?: number[][];
  delivery_fee: number;
  min_order: number;
  estimated_time: string;
  is_active: boolean;
}

// Получаем API ключ 2GIS из переменных окружения
const TWOGIS_API_KEY = import.meta.env.VITE_2GIS_API_KEY || 'YOUR_API_KEY_HERE';

const DeliveryZones: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await api.getDeliveryZones();
      setZones(data);
    } catch (error) {
      console.error('Ошибка загрузки зон доставки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleZone = async (id: number) => {
    try {
      const zone = zones.find(z => z.id === id);
      if (!zone) return;
      
      await api.updateDeliveryZone(id, { is_active: !zone.is_active });
      setZones(zones.map(z => 
        z.id === id ? { ...z, is_active: !z.is_active } : z
      ));
    } catch (error) {
      console.error('Ошибка обновления зоны:', error);
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setShowZoneModal(true);
  };

  const handleAddZone = () => {
    setEditingZone({
      id: 0,
      name: '',
      color: '#667eea',
      delivery_fee: 500,
      min_order: 3000,
      estimated_time: '30-40 мин',
      is_active: true,
    });
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    try {
      if (editingZone.id) {
        // Обновление существующей зоны
        const updated = await api.updateDeliveryZone(editingZone.id, {
          name: editingZone.name,
          color: editingZone.color,
          coordinates: editingZone.coordinates || [],
          delivery_fee: editingZone.delivery_fee,
          min_order: editingZone.min_order,
          estimated_time: editingZone.estimated_time,
          is_active: editingZone.is_active,
        });
        setZones(zones.map(z => z.id === editingZone.id ? updated : z));
      } else {
        // Создание новой зоны
        const created = await api.createDeliveryZone({
          name: editingZone.name,
          color: editingZone.color,
          coordinates: editingZone.coordinates || [],
          delivery_fee: editingZone.delivery_fee,
          min_order: editingZone.min_order,
          estimated_time: editingZone.estimated_time,
          is_active: editingZone.is_active,
        });
        setZones([...zones, created]);
      }
      setShowZoneModal(false);
      setEditingZone(null);
    } catch (error) {
      console.error('Ошибка сохранения зоны:', error);
      alert('Ошибка при сохранении зоны доставки');
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту зону доставки?')) {
      try {
        await api.deleteDeliveryZone(id);
        setZones(zones.filter(z => z.id !== id));
      } catch (error) {
        console.error('Ошибка удаления зоны:', error);
        alert('Ошибка при удалении зоны доставки');
      }
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
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
            <TwoGisMap
              zones={zones}
              center={[71.443112, 51.129547]}
              zoom={12}
              height="500px"
              apiKey={TWOGIS_API_KEY}
              onZoneClick={(zone) => handleEditZone(zone)}
            />
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
                <div key={zone.id} className={`zone-card ${!zone.is_active ? 'zone-inactive' : ''}`}>
                  <div className="zone-card-header">
                    <div className="zone-color-indicator" style={{ background: zone.color }}></div>
                    <h4 className="zone-card-name">{zone.name}</h4>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={zone.is_active}
                        onChange={() => handleToggleZone(zone.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="zone-card-body">
                    <div className="zone-info-row">
                      <span className="zone-info-label">Стоимость доставки:</span>
                      <span className="zone-info-value">{zone.delivery_fee} ₸</span>
                    </div>
                    <div className="zone-info-row">
                      <span className="zone-info-label">Минимальный заказ:</span>
                      <span className="zone-info-value">{zone.min_order} ₸</span>
                    </div>
                    <div className="zone-info-row">
                      <span className="zone-info-label">Время доставки:</span>
                      <span className="zone-info-value">{zone.estimated_time}</span>
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
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
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

                <div className="form-field">
                  <label>Область доставки на карте</label>
                  <TwoGisEditorMap
                    zone={editingZone}
                    onCoordinatesChange={(coords) => setEditingZone({ ...editingZone, coordinates: coords })}
                    center={[71.4491, 51.1694]}
                    zoom={13}
                    height="400px"
                    apiKey={TWOGIS_API_KEY}
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Стоимость доставки (₸) *</label>
                    <input
                      type="number"
                      value={editingZone.delivery_fee}
                      onChange={(e) => setEditingZone({ ...editingZone, delivery_fee: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Минимальный заказ (₸) *</label>
                    <input
                      type="number"
                      value={editingZone.min_order}
                      onChange={(e) => setEditingZone({ ...editingZone, min_order: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Время доставки *</label>
                  <input
                    type="text"
                    value={editingZone.estimated_time}
                    onChange={(e) => setEditingZone({ ...editingZone, estimated_time: e.target.value })}
                    placeholder="30-40 мин"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingZone.is_active}
                      onChange={(e) => setEditingZone({ ...editingZone, is_active: e.target.checked })}
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
      </div>
    </div>
  );
};

export default DeliveryZones;