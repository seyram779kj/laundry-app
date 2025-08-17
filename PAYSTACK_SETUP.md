# Paystack Integration Setup Guide

## Overview
This laundry app now supports Paystack for Mobile Money (MoMo) payments in Ghana, including:
- MTN Mobile Money (MoMo)
- Vodafone Cash  
- AirtelTigo Money
- Credit/Debit Cards
- Bank Transfers

## 1. Get Paystack API Keys

### Test Keys (for development)
1. Visit https://dashboard.paystack.com and sign up/login
2. Go to Settings > API Keys & Webhooks
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. Copy your **Test Public Key** (starts with `pk_test_`)

### Live Keys (for production)
1. Complete Paystack account verification
2. Go to Settings > API Keys & Webhooks  
3. Copy your **Live Secret Key** (starts with `sk_live_`)
4. Copy your **Live Public Key** (starts with `pk_live_`)

## 2. Configure Environment Variables

Update your `backend/.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY_TEST=sk_test_your_actual_test_key_here
PAYSTACK_PUBLIC_KEY_TEST=pk_test_your_actual_public_key_here
PAYSTACK_SECRET_KEY_LIVE=sk_live_your_actual_live_key_here  
PAYSTACK_PUBLIC_KEY_LIVE=pk_live_your_actual_public_key_here
PAYSTACK_ENV=test
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here

# Application URLs
APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000
```

**Important:** Replace the placeholder values with your actual Paystack keys!

## 3. Test Mobile Money Numbers (Test Mode)

In test mode, use these phone numbers for testing:
- **MTN MoMo**: 0552000001, 0242000001
- **Vodafone Cash**: 0202000001
- **AirtelTigo**: 0272000001

Any valid Ghana phone number format (0XXXXXXXXX) works in test mode.

## 4. Webhook Setup (Optional but Recommended)

1. In Paystack Dashboard, go to Settings > API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/api/paystack/webhook`
3. Select events: `charge.success`, `charge.failed`
4. Copy the webhook secret and add to your `.env` file

## 5. Payment Flow

### Customer Experience:
1. **Create Order**: Customer selects services and enters items
2. **Choose Payment**: Select "Mobile Money" or "Card Payment"  
3. **Enter Details**: For MoMo, enter phone number and provider
4. **Initialize Payment**: System creates Paystack payment session
5. **Complete Payment**: Redirected to Paystack payment page
6. **Confirmation**: Automatic verification and order confirmation

### Provider Experience:
- Receive email notifications when payments are completed
- View payment status in provider dashboard
- Automatic order status updates

## 6. Currency Support

- All amounts displayed in **Ghana Cedis (¢)**
- Paystack handles the conversion to kobo/pesewas internally
- Pricing: ¢2.50 per clothing item for wash & iron service

## 7. Supported Payment Methods

### Mobile Money:
- MTN Mobile Money
- Vodafone Cash  
- AirtelTigo Money

### Cards:
- Visa, Mastercard, Verve
- Local and international cards

### Bank Transfer:
- All major Ghana banks
- Instant bank transfers

## 8. Error Handling

The system handles various payment scenarios:
- **Payment Success**: Order confirmed, emails sent
- **Payment Failed**: User can retry payment  
- **Payment Cancelled**: Order remains pending
- **Network Issues**: Automatic retry mechanism

## 9. Security Features

- **Webhook Verification**: All webhook requests verified
- **Reference Generation**: Unique payment references
- **Status Tracking**: Complete payment audit trail
- **Test Mode Protection**: Clear test/live mode indicators

## 10. Testing Checklist

### Before Going Live:
- [ ] Test with MoMo test numbers
- [ ] Verify email notifications work
- [ ] Test payment failure scenarios  
- [ ] Check webhook responses
- [ ] Validate order confirmation flow
- [ ] Test payment retry functionality

### Production Deployment:
- [ ] Switch to live API keys
- [ ] Update webhook URLs to production domain
- [ ] Set `PAYSTACK_ENV=live` in production
- [ ] Test with small real payment first

## 11. Support

### Paystack Support:
- Documentation: https://paystack.com/docs
- Support: https://paystack.com/support
- Phone: +234 1 888 7888

### Implementation Questions:
- Check the PaystackPayment component for frontend logic
- Review paystackService.js for backend payment processing
- Examine routes/paystack.js for API endpoints

## 12. Common Issues & Solutions

### "Invalid API Key" Error:
- Verify you're using the correct environment keys (test vs live)
- Ensure no extra spaces in the .env file

### Mobile Money Payment Fails:
- Check phone number format (233XXXXXXXXX)
- Verify MoMo account has sufficient balance
- Try different provider (MTN vs Vodafone)

### Webhook Not Working:
- Ensure webhook URL is accessible publicly
- Check webhook secret matches
- Verify HTTPS for production webhooks

### Payment Shows as Pending:
- Check webhook configuration
- Manually verify payment in Paystack dashboard
- Review server logs for errors

## 13. Next Steps

1. **Replace API Keys**: Update .env with your actual Paystack keys
2. **Test Payments**: Use test numbers to verify flow works
3. **Set up Webhooks**: Configure for automatic payment verification
4. **Go Live**: Switch to live keys when ready for production

Your Paystack integration is now ready! 🎉