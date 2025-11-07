from typing import Optional
import httpx
from app.core.config import settings

class KaspiPaymentService:
    """Service for Kaspi QR payment integration."""
    
    def __init__(self):
        self.api_url = settings.KASPI_API_URL
        self.api_key = settings.KASPI_API_KEY
        self.merchant_id = settings.KASPI_MERCHANT_ID
    
    async def create_invoice(self, order_id: int, amount: float) -> dict:
        """
        Create a payment invoice with Kaspi.
        Returns: {
            "token": "qr_token_string",
            "payment_url": "https://kaspi.kz/pay/..."
        }
        """
        # Mock implementation - replace with real Kaspi API integration
        # Real implementation would make HTTP request to Kaspi API
        
        async with httpx.AsyncClient() as client:
            try:
                # Example API call structure (adjust based on real Kaspi API documentation)
                payload = {
                    "merchant_id": self.merchant_id,
                    "order_id": str(order_id),
                    "amount": amount,
                    "currency": "KZT",
                    "description": f"Order #{order_id} at Social Coffee"
                }
                
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # Mock response for development
                # response = await client.post(
                #     f"{self.api_url}/invoices",
                #     json=payload,
                #     headers=headers
                # )
                # data = response.json()
                
                # Mock data for development
                token = f"mock_kaspi_token_{order_id}"
                payment_url = f"https://kaspi.kz/pay/{token}"
                
                return {
                    "token": token,
                    "payment_url": payment_url
                }
                
            except Exception as e:
                # Handle API errors
                print(f"Kaspi API error: {e}")
                raise Exception("Failed to create payment invoice")
    
    async def check_payment_status(self, payment_token: str) -> str:
        """
        Check payment status with Kaspi.
        Returns: "pending" | "paid" | "failed" | "cancelled"
        """
        # Mock implementation - replace with real Kaspi API integration
        
        async with httpx.AsyncClient() as client:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # Mock response for development
                # response = await client.get(
                #     f"{self.api_url}/invoices/{payment_token}/status",
                #     headers=headers
                # )
                # data = response.json()
                # return data.get("status", "pending")
                
                # Mock: return "paid" for testing
                return "pending"  # Change to "paid" to test successful payment
                
            except Exception as e:
                print(f"Kaspi API error: {e}")
                return "pending"

kaspi_service = KaspiPaymentService()
