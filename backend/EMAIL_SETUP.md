# Email Setup Guide

## Gmail SMTP Configuration

To enable real email sending functionality, you need to configure Gmail SMTP:

### 1. Create a Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" → "2-Step Verification" (enable if not already)
3. Go to "App passwords" (under 2-Step Verification)
4. Select "Mail" and "Other (Custom name)"
5. Enter "Laundry App" as the name
6. Click "Generate"
7. Copy the 16-character app password

### 2. Create .env File

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/laundry-app

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Email Configuration (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Replace Placeholder Values

- `your_email@gmail.com`: Your Gmail address
- `your_gmail_app_password`: The 16-character app password from step 1
- `your_jwt_secret_here`: A secure random string for JWT signing

### 4. Test Email Functionality

1. Start the backend server: `npm run dev`
2. Register a new user with a real email address
3. Check the email inbox for the verification code
4. Enter the code in the app to complete registration

### Security Notes

- Never commit your `.env` file to version control
- Use a dedicated Gmail account for production
- Consider using email services like SendGrid or AWS SES for production
- The app password is more secure than your regular Gmail password

### Troubleshooting

**Email not sending:**
- Check that 2-Step Verification is enabled
- Verify the app password is correct
- Ensure the Gmail account is not blocked
- Check server logs for error messages

**Gmail blocking emails:**
- Enable "Less secure app access" (not recommended for production)
- Use app passwords instead (recommended)
- Check Gmail's security settings 