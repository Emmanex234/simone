import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

const app = express();
dotenv.config();

// Security Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/membership', apiLimiter);

// File Upload Configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, or GIF images are allowed'));
    }
  }
});

// Email Transport Configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER || 'emmanueludofot40@gmail.com',
    pass: process.env.EMAIL_PASS || 'rhzd xucq gahw rawc'
  }
});

// Admin email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emmanueludofot77@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'emmanueludofot40@gmail.com';

// Helper Functions
const getPlanDetails = (plan) => {
  const plans = {
    bronze: { name: 'Bronze Membership', price: '€453.32', color: '#cd7f32' },
    silver: { name: 'Silver Membership', price: '€649.99', color: '#c0c0c0' },
    gold: { name: 'Gold Membership', price: '€999.99', color: '#ffd700' }
  };
  return plans[plan.toLowerCase()] || { name: plan, price: 'N/A', color: '#7c3aed' };
};

const createCustomerEmail = (planDetails, paymentMethod, transactionId) => {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Membership Confirmation</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${planDetails.color}; padding: 30px; text-align: center; color: white; }
        .content { padding: 25px; background-color: #f9f9f9; }
        .details-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${planDetails.color}; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; vertical-align: top; }
        .label { color: #666; font-weight: bold; width: 40%; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to the Simone Susinna Fan Club!</h1>
        <p>Your ${planDetails.name} is now active</p>
      </div>
      
      <div class="content">
        <p>Dear Valued Member,</p>
        
        <p>Thank you for joining our exclusive community. Here are your membership details:</p>
        
        <div class="details-card">
          <h2>Membership Information</h2>
          <table>
            <tr><td class="label">Plan:</td><td>${planDetails.name}</td></tr>
            <tr><td class="label">Price:</td><td>${planDetails.price}</td></tr>
            <tr><td class="label">Payment Method:</td><td>${paymentMethod}</td></tr>
            <tr><td class="label">Transaction ID:</td><td>${transactionId}</td></tr>
            <tr><td class="label">Activation Date:</td><td>${formattedDate}</td></tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://fanclub.simonesusinna.com/portal" class="button">Access Member Portal</a>
        </div>
        
        <p>If you have any questions about your membership, please reply to this email.</p>
        
        <p>Welcome aboard!</p>
        <p><strong>The Simone Susinna Team</strong></p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Simone Susinna Fan Club. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

const createAdminNotification = (planDetails, email, paymentMethod, transactionId, giftCardPin, hasImage) => {
  const displayPin = giftCardPin || 'N/A';
  const formattedDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Membership Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .success { background-color: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .pin-highlight { background-color: #fff3cd; border: 2px solid #ffc107; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { text-align: left; padding: 12px 8px; background-color: #f2f2f2; font-weight: bold; }
        td { padding: 12px 8px; border-bottom: 1px solid #ddd; }
        .highlight { background-color: #fff3cd; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>🔔 New Membership Purchase</h1>
      
      <div class="success">
        <strong>New Member Alert:</strong> A new ${planDetails.name} has been purchased!
      </div>
      
      ${paymentMethod === 'Gift Card' ? `
      <div class="alert">
        <strong>⚠️ Action Required:</strong> Please verify this Gift Card payment before activating membership benefits.
      </div>
      ` : `
      <div class="success">
        <strong>✅ Payment Method:</strong> ${paymentMethod} payment received.
      </div>
      `}
      
      <table>
        <tr><th>Purchase Date:</th><td>${formattedDate}</td></tr>
        <tr><th>Customer Email:</th><td><strong>${email}</strong></td></tr>
        <tr><th>Membership Plan:</th><td class="highlight">${planDetails.name} (${planDetails.price})</td></tr>
        <tr><th>Payment Method:</th><td>${paymentMethod}</td></tr>
        <tr><th>Transaction ID:</th><td><code>${transactionId}</code></td></tr>
        ${paymentMethod === 'Gift Card' ? `
        <tr><th>Gift Card PIN:</th><td><div class="pin-highlight">${displayPin}</div></td></tr>
        <tr><th>Image Attached:</th><td>${hasImage ? '✅ Yes' : '❌ No'}</td></tr>
        ` : ''}
      </table>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <h3>Next Steps:</h3>
        <ul>
          ${paymentMethod === 'Gift Card' ? `
          <li>Verify the gift card details and image (if provided)</li>
          <li>Confirm the gift card PIN is valid</li>
          <li>Activate membership benefits once verified</li>
          ` : `
          <li>Payment has been processed automatically</li>
          <li>Membership benefits should be activated</li>
          <li>Customer has been notified via email</li>
          `}
          <li>Update customer records</li>
          <li>Monitor for any customer service inquiries</li>
        </ul>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p><strong>Simone Susinna Fan Club Admin Panel</strong><br>
        This is an automated notification. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

// API Endpoint
app.post('/api/membership', upload.single('giftCardImage'), async (req, res) => {
  try {
    // Input Validation
    const { email, plan, paymentMethod, transactionId, giftCardPin } = req.body;
    const imageFile = req.file;

    if (!email || !plan || !paymentMethod || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    if (paymentMethod === 'Gift Card' && giftCardPin && !/^\d{4,8}$/.test(giftCardPin)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Gift card PIN must be 4-8 digits' 
      });
    }

    const planDetails = getPlanDetails(plan);
    let emailsSent = { customer: false, admin: false };

    // Send Customer Email
    try {
      await transporter.sendMail({
        from: `Simone Susinna Fan Club <${FROM_EMAIL}>`,
        to: email,
        subject: `🎉 Your ${planDetails.name} Confirmation`,
        html: createCustomerEmail(planDetails, paymentMethod, transactionId)
      });
      console.log(`✅ Customer email sent to ${email}`);
      emailsSent.customer = true;
    } catch (emailError) {
      console.error('❌ Failed to send customer email:', emailError);
      throw new Error('Failed to send confirmation email');
    }

    // Send Admin Notification - FIXED: Removed the incorrect condition
    try {
      const adminMailOptions = {
        from: `Simone Susinna Fan Club <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `⚠️ New ${planDetails.name} Purchase (${paymentMethod}) - ${email}`,
        html: createAdminNotification(
          planDetails,
          email,
          paymentMethod,
          transactionId,
          giftCardPin,
          !!imageFile
        ),
        attachments: []
      };

      // Add gift card image as attachment if provided
      if (imageFile) {
        adminMailOptions.attachments.push({
          filename: `giftcard_${transactionId}${path.extname(imageFile.originalname) || '.jpg'}`,
          content: imageFile.buffer,
          contentType: imageFile.mimetype
        });
      }

      await transporter.sendMail(adminMailOptions);
      console.log(`✅ Admin notification sent to ${ADMIN_EMAIL}`);
      emailsSent.admin = true;
    } catch (adminEmailError) {
      console.error('❌ Failed to send admin email:', adminEmailError);
      // Don't fail the request just because admin email failed, but log it
      console.warn('⚠️ Continuing without admin notification');
    }

    // Log the transaction for debugging
    console.log(`📝 Membership transaction processed:`, {
      email,
      plan: planDetails.name,
      paymentMethod,
      transactionId,
      hasImage: !!imageFile,
      emailsSent
    });

    res.status(200).json({
      success: true,
      message: 'Membership processed successfully',
      data: {
        plan: planDetails.name,
        price: planDetails.price,
        emailSent: emailsSent.customer,
        adminNotified: emailsSent.admin
      }
    });

  } catch (error) {
    console.error('💥 Membership processing error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          error: 'Image file too large (max 5MB)' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        error: 'File upload error' 
      });
    }

    if (error.message.includes('Only image files')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only JPEG, PNG, or GIF images are allowed' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Simone Susinna Membership API',
    emailConfig: {
      fromEmail: FROM_EMAIL,
      adminEmail: ADMIN_EMAIL
    }
  });
});

// Test Email Endpoint (for debugging)
app.post('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: `Simone Susinna Fan Club <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: '🧪 Test Email - Admin Notifications',
      html: '<h2>Test Email</h2><p>If you received this, admin notifications are working correctly!</p>'
    });
    
    res.json({ 
      success: true, 
      message: `Test email sent to ${ADMIN_EMAIL}` 
    });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 From Email: ${FROM_EMAIL}`);
  console.log(`👨‍💼 Admin Email: ${ADMIN_EMAIL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});