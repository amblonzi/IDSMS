import httpx
import base64
from datetime import datetime
from app.core.config import settings

class MpesaService:
    BASE_URL = "https://sandbox.safaricom.co.ke" if settings.ENVIRONMENT == "development" else "https://api.safaricom.co.ke"
    
    @staticmethod
    def get_password(shortcode, passkey, timestamp):
        data_to_encode = f"{shortcode}{passkey}{timestamp}"
        return base64.b64encode(data_to_encode.encode()).decode('utf-8')

    @classmethod
    async def get_access_token(cls):
        url = f"{cls.BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, 
                auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET)
            )
            response.raise_for_status()
            return response.json()['access_token']

    @classmethod
    async def stk_push(cls, phone_number: str, amount: float, account_reference: str, transaction_desc: str):
        token = await cls.get_access_token()
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = cls.get_password(settings.MPESA_SHORTCODE, settings.MPESA_PASSKEY, timestamp)
        
        # Ensure phone number format is 254...
        if phone_number.startswith('0'):
            phone_number = f"254{phone_number[1:]}"
        elif phone_number.startswith('+'):
            phone_number = phone_number[1:]
            
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount), # M-Pesa accepts integers
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }
        
        url = f"{cls.BASE_URL}/mpesa/stkpush/v1/processrequest"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
