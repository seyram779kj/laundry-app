
const crypto = require('crypto');

class MoMoService {
  constructor() {
    // These would be your actual MoMo API credentials
    this.apiKey = process.env.MOMO_API_KEY || 'demo_api_key';
    this.apiSecret = process.env.MOMO_API_SECRET || 'demo_api_secret';
    this.baseUrl = process.env.MOMO_BASE_URL || 'https://api.momo.com/v1';
    this.merchantId = process.env.MOMO_MERCHANT_ID || 'demo_merchant';
  }

  // Generate transaction reference
  generateTransactionRef() {
    return `MOMO_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // Initiate MoMo payment
  async initiatePayment(paymentData) {
    const { amount, phoneNumber, customerName, orderId } = paymentData;
    
    const transactionRef = this.generateTransactionRef();
    
    // In a real implementation, you would make an HTTP request to MoMo API
    // For demo purposes, we'll simulate the API response
    try {
      console.log(`🔄 Initiating MoMo payment for ${phoneNumber} - Amount: ${amount}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate different scenarios based on phone number for testing
      const lastDigit = phoneNumber.slice(-1);
      
      if (lastDigit === '1') {
        // Simulate failed payment
        return {
          success: false,
          transactionRef,
          status: 'failed',
          message: 'Insufficient funds',
          errorCode: 'INSUFFICIENT_FUNDS'
        };
      } else if (lastDigit === '2') {
        // Simulate pending payment (user needs to approve on phone)
        return {
          success: true,
          transactionRef,
          status: 'pending',
          message: 'Payment request sent to customer phone. Waiting for approval.',
          paymentUrl: `momo://pay?ref=${transactionRef}`
        };
      } else {
        // Simulate successful payment
        return {
          success: true,
          transactionRef,
          status: 'completed',
          message: 'Payment completed successfully',
          transactionId: `TXN_${transactionRef}`
        };
      }
    } catch (error) {
      console.error('MoMo payment error:', error);
      return {
        success: false,
        transactionRef,
        status: 'failed',
        message: 'Payment processing failed',
        error: error.message
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionRef) {
    try {
      console.log(`🔍 Checking MoMo payment status for: ${transactionRef}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For demo, simulate status based on transaction ref
      const statusRandom = Math.random();
      
      if (statusRandom > 0.8) {
        return {
          success: true,
          status: 'completed',
          transactionId: `TXN_${transactionRef}`,
          message: 'Payment completed'
        };
      } else if (statusRandom > 0.6) {
        return {
          success: true,
          status: 'pending',
          message: 'Payment still pending user approval'
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'Payment was declined'
        };
      }
    } catch (error) {
      console.error('Status check error:', error);
      return {
        success: false,
        status: 'failed',
        message: 'Could not check payment status'
      };
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    // Remove any spaces or special characters
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid format (10-15 digits, starting with country code or local format)
    const phoneRegex = /^(\+?[1-9]\d{1,14}|0\d{9})$/;
    
    return phoneRegex.test(cleanNumber);
  }

  // Format phone number
  formatPhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add country code if not present (assuming Ghana +233)
    if (cleanNumber.startsWith('0')) {
      return '+233' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('+')) {
      return '+233' + cleanNumber;
    }
    
    return cleanNumber;
  }
}

module.exports = new MoMoService();
