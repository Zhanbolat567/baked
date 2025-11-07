import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore, useCartStore } from '../store';
import api from '../services/api';
import { PaymentResponse } from '../types';
import './components.css';

interface PaymentModalProps {
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const language = useAppStore((state) => state.language);
  const cart = useCartStore();
  
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const getText = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      kaspiQR: { rus: 'Kaspi QR', kaz: 'Kaspi QR', eng: 'Kaspi QR' },
      scanAndPay: { rus: 'Сканируйте и платите', kaz: 'Сканерлеңіз және төлеңіз', eng: 'Scan and pay' },
      checkingPayment: { rus: 'Проверяем оплату...', kaz: 'Төлемді тексеріп жатырмыз...', eng: 'Checking payment...' },
      paymentSuccess: { rus: 'Оплата успешна!', kaz: 'Төлем сәтті!', eng: 'Payment successful!' },
      paymentFailed: { rus: 'Оплата не прошла', kaz: 'Төлем өтпеді', eng: 'Payment failed' },
      orderNumber: { rus: 'Номер заказа', kaz: 'Тапсырыс нөмірі', eng: 'Order number' },
      total: { rus: 'К оплате', kaz: 'Төлеуге', eng: 'Total' },
      close: { rus: 'Закрыть', kaz: 'Жабу', eng: 'Close' },
      createOrderError: { rus: 'Ошибка создания заказа', kaz: 'Тапсырыс жасау қатесі', eng: 'Order creation error' },
    };
    return translations[key]?.[language] || translations[key]?.['rus'] || key;
  };

  useEffect(() => {
    createOrder();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare order data
      const orderItems = cart.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        selected_options: item.selected_options
      }));

      // Create order
      const response = await api.createOrder({ items: orderItems });
      setPaymentData(response);

      // Start polling for payment status
      startPolling(response.order_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || getText('createOrderError'));
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderId: number) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await api.getOrderStatus(orderId);
        
        if (statusResponse.status === 'paid' || statusResponse.status === 'completed') {
          setPaymentStatus('paid');
          clearInterval(interval);
          
          // Clear cart and show success for 2 seconds before closing
          setTimeout(() => {
            cart.clearCart();
            onClose();
          }, 2000);
        } else if (statusResponse.status === 'cancelled') {
          setPaymentStatus('failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 3000); // Check every 3 seconds

    setPollingInterval(interval);
  };

  const handleClose = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{getText('kaspiQR')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body payment-body">
          {loading && (
            <div className="payment-loading">
              <div className="spinner"></div>
              <p>{getText('checkingPayment')}</p>
            </div>
          )}

          {error && (
            <div className="payment-error">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={createOrder}>
                Попробовать снова
              </button>
            </div>
          )}

          {paymentData && !loading && !error && (
            <>
              {paymentStatus === 'pending' && (
                <div className="payment-pending">
                  <div className="qr-container">
                    <QRCodeSVG 
                      value={paymentData.payment_url} 
                      size={280}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <h3 className="payment-title">{getText('scanAndPay')}</h3>
                  <div className="payment-amount">{paymentData.total_amount.toFixed(0)} ₸</div>
                  <div className="payment-order-id">
                    {getText('orderNumber')}: #{paymentData.order_id}
                  </div>
                  <div className="payment-status-indicator">
                    <div className="status-spinner"></div>
                    <span>{getText('checkingPayment')}</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'paid' && (
                <div className="payment-success">
                  <div className="success-icon">✅</div>
                  <h3>{getText('paymentSuccess')}</h3>
                  <p>{getText('orderNumber')}: #{paymentData.order_id}</p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="payment-failed">
                  <div className="error-icon">❌</div>
                  <h3>{getText('paymentFailed')}</h3>
                  <button className="btn btn-primary" onClick={createOrder}>
                    Попробовать снова
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-full" onClick={handleClose}>
            {getText('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
