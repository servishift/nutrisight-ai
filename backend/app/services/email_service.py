import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime, timedelta
from app.config import Config
import os

# In-memory OTP storage (use Redis in production)
otp_store = {}

def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def store_otp(email, otp):
    """Store OTP with 10-minute expiry"""
    otp_store[email] = {
        'code': otp,
        'expires': datetime.now() + timedelta(minutes=10)
    }

def verify_otp(email, otp):
    """Verify OTP code"""
    if email not in otp_store:
        return False
    
    stored = otp_store[email]
    if datetime.now() > stored['expires']:
        del otp_store[email]
        return False
    
    if stored['code'] == otp:
        del otp_store[email]
        return True
    
    return False

def send_otp_email(email, otp):
    """Send OTP via email"""
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'FoodIntel AI - Verification Code'
    msg['From'] = Config.SMTP_EMAIL
    msg['To'] = email
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">FoodIntel AI</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #2d5016;">Verify Your Email</h2>
          <p>Your verification code is:</p>
          <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #2d5016; font-size: 36px; letter-spacing: 8px; margin: 0;">{otp}</h1>
          </div>
          <p style="color: #666;">This code expires in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html'))
    
    with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
        server.starttls()
        server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
        server.send_message(msg)

def send_password_reset_email(email, token):
    """Send password reset email"""
    reset_link = f"{Config.FRONTEND_URL}/reset-password?token={token}"
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'FoodIntel AI - Password Reset'
    msg['From'] = Config.SMTP_EMAIL
    msg['To'] = email
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">FoodIntel AI</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #2d5016;">Reset Your Password</h2>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background: #2d5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 12px;">Or copy this link: {reset_link}</p>
          <p style="color: #666; font-size: 12px;">This link expires in 1 hour.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html'))
    
    with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
        server.starttls()
        server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
        server.send_message(msg)

def send_campaign_email(email, subject, body):
    """Send campaign email to user"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = Config.SMTP_EMAIL
        msg['To'] = email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">NutriSight AI</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              {body}
            </div>
            <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
              <p>© 2024 NutriSight AI. All rights reserved.</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email to {email}: {str(e)}")
        return False

def send_payment_receipt(email, name, plan_name, amount, payment_id, start_date, end_date, order_id=None):
    """Send payment receipt email"""
    try:
        current_date = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Payment Receipt - {plan_name} Plan Subscription'
        msg['From'] = Config.SMTP_EMAIL
        msg['To'] = email
        
        # Plan features based on plan name
        features_html = ""
        if plan_name == 'Pro':
            features_html = """
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2d5016; margin-top: 0;">Your Plan Includes:</h4>
              <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                <li>5,000 ingredient analyses per month</li>
                <li>ML-powered category & brand predictions</li>
                <li>Batch processing (5,000 rows/month)</li>
                <li>API access (10,000 requests/month)</li>
                <li>Advanced features: Webhooks, Similarity Search, Export Reports</li>
                <li>Priority customer support</li>
              </ul>
            </div>
            """
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NutriSight AI</h1>
              <p style="color: #e0e0e0; margin: 5px 0 0 0; font-size: 14px;">Payment Receipt</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: #d4edda; color: #155724; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                  ✓ Payment Successful
                </div>
              </div>
              
              <h2 style="color: #2d5016; margin-top: 0;">Hi {name},</h2>
              <p style="color: #333; line-height: 1.6;">Thank you for subscribing to NutriSight AI! Your payment has been processed successfully and your <strong>{plan_name}</strong> plan is now active.</p>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2d5016;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">📄 Transaction Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Transaction ID:</td>
                    <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 12px; border-bottom: 1px solid #e0e0e0;">{payment_id}</td>
                  </tr>
                  {f'''<tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Order ID:</td>
                    <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 12px; border-bottom: 1px solid #e0e0e0;">{order_id}</td>
                  </tr>''' if order_id else ''}
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Payment Date:</td>
                    <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e0e0e0;">{current_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Payment Method:</td>
                    <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e0e0e0;">Razorpay</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Payment Status:</td>
                    <td style="padding: 10px 0; text-align: right; color: #28a745; font-weight: bold; border-bottom: 1px solid #e0e0e0;">✓ Completed</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">💳 Subscription Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Plan Name:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 16px; color: #2d5016; border-bottom: 1px solid #e0e0e0;">{plan_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Billing Cycle:</td>
                    <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e0e0e0;">Monthly</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Subscription Start:</td>
                    <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e0e0e0;">{start_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Valid Until:</td>
                    <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e0e0e0;">{end_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0 10px 0; color: #666; font-size: 18px; font-weight: bold;">Amount Paid:</td>
                    <td style="padding: 15px 0 10px 0; text-align: right; font-size: 24px; font-weight: bold; color: #2d5016;">₹{amount}</td>
                  </tr>
                </table>
              </div>
              
              {features_html}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{Config.FRONTEND_URL}/dashboard" style="background: #2d5016; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Access Dashboard →</a>
              </div>
              
              <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  <strong>Need Help?</strong><br>
                  Contact our support team at support@nutrisight.ai or visit our help center.
                </p>
              </div>
              
              <p style="color: #999; font-size: 11px; line-height: 1.5; margin-top: 20px;">
                This is an automated receipt for your records. Please save this email for future reference. 
                For any billing inquiries, please quote your Transaction ID: {payment_id}
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #2d5016; color: white;">
              <p style="margin: 0; font-size: 12px;">© 2024 NutriSight AI. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #ccc;">Powered by Razorpay Secure Payments</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send receipt email to {email}: {str(e)}")
        return False

def send_renewal_reminder(email, name, plan_name, expiry_date):
    """Send subscription renewal reminder"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Your {plan_name} Plan is Expiring Soon'
        msg['From'] = Config.SMTP_EMAIL
        msg['To'] = email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">NutriSight AI</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #2d5016;">Subscription Renewal Reminder</h2>
              <p>Hi {name},</p>
              <p>Your <strong>{plan_name}</strong> subscription will expire on <strong>{expiry_date}</strong>.</p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">⚠️ Don't lose access to your premium features!</p>
              </div>
              
              <p>Renew now to continue enjoying:</p>
              <ul style="color: #666;">
                <li>Unlimited ingredient analysis</li>
                <li>ML-powered predictions</li>
                <li>API access</li>
                <li>Batch processing</li>
                <li>Priority support</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{Config.FRONTEND_URL}/pricing" style="background: #2d5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Renew Subscription</a>
              </div>
              
              <p style="color: #666; font-size: 12px;">Questions? Contact our support team anytime.</p>
            </div>
            <div style="padding: 20px; text-align: center; background: #f0f0f0; font-size: 12px; color: #666;">
              <p>© 2024 NutriSight AI. All rights reserved.</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send renewal reminder to {email}: {str(e)}")
        return False

def send_api_subscription_confirmation(email, name, plan_name, amount, payment_id, requests_limit, rate_limit, start_date, end_date):
    """Send API subscription confirmation email"""
    try:
        current_date = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'API Subscription Confirmed - {plan_name} Plan'
        msg['From'] = Config.SMTP_EMAIL
        msg['To'] = email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NutriSight AI</h1>
              <p style="color: #e0e0e0; margin: 5px 0 0 0; font-size: 14px;">API Subscription Confirmed</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: #d4edda; color: #155724; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                  ✓ Subscription Active
                </div>
              </div>
              
              <h2 style="color: #2d5016; margin-top: 0;">Hi {name},</h2>
              <p style="color: #333; line-height: 1.6;">Your API subscription to <strong>{plan_name}</strong> is now active! You can start making API requests immediately.</p>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">🚀 Your API Plan</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Plan:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #2d5016; border-bottom: 1px solid #e0e0e0;">{plan_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Monthly Requests:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #e0e0e0;">{requests_limit if requests_limit != -1 else 'Unlimited'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Rate Limit:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #e0e0e0;">{rate_limit} req/min</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Valid Until:</td>
                    <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e0e0e0;">{end_date if end_date else 'Lifetime'}</td>
                  </tr>
                  {f'''<tr>
                    <td style="padding: 15px 0 10px 0; color: #666; font-size: 16px; font-weight: bold;">Amount Paid:</td>
                    <td style="padding: 15px 0 10px 0; text-align: right; font-size: 20px; font-weight: bold; color: #2d5016;">₹{amount}</td>
                  </tr>''' if amount > 0 else ''}
                </table>
              </div>
              
              <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">🔑 Next Steps</h3>
                <ol style="color: #666; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                  <li>Go to your <a href="{Config.FRONTEND_URL}/api-keys" style="color: #2d5016;">API Keys page</a></li>
                  <li>Your existing API keys now have {plan_name} limits</li>
                  <li>Start making requests to our API endpoints</li>
                  <li>Monitor usage in your <a href="{Config.FRONTEND_URL}/api-usage" style="color: #2d5016;">dashboard</a></li>
                </ol>
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">📚 API Features</h3>
                <ul style="color: #666; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                  <li>Category Prediction (ML)</li>
                  <li>Similarity Search (BERT)</li>
                  <li>Brand Prediction (NLP)</li>
                  <li>Indian Food Database</li>
                  <li>Ingredient Analysis</li>
                  <li>Nutrition Lookup</li>
                </ul>
              </div>
              
              {f'''<div style="background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #2e7d32; font-size: 13px;">
                  <strong>💳 Payment Confirmed</strong><br>
                  Transaction ID: {payment_id}<br>
                  Date: {current_date}
                </p>
              </div>''' if payment_id else ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{Config.FRONTEND_URL}/api-keys" style="background: #2d5016; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; margin-right: 10px;">View API Keys →</a>
                <a href="{Config.FRONTEND_URL}/api-usage" style="background: #4a7c2c; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View Usage →</a>
              </div>
              
              <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  <strong>Need Help?</strong><br>
                  📧 Email: api-support@nutrisight.ai<br>
                  📖 Docs: <a href="{Config.FRONTEND_URL}/docs" style="color: #2d5016;">API Documentation</a>
                </p>
              </div>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #2d5016; color: white;">
              <p style="margin: 0; font-size: 12px;">© 2024 NutriSight AI. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #ccc;">Powered by Razorpay Secure Payments</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send API subscription confirmation to {email}: {str(e)}")
        return False

def send_api_usage_alert(email, name, plan_name, threshold, used, limit):
    """Send API usage alert email"""
    try:
        msg = MIMEMultipart('alternative')
        
        if threshold == 100:
            msg['Subject'] = f'⚠️ API Limit Reached - {plan_name}'
            alert_color = '#dc3545'
            alert_icon = '🚫'
            alert_title = 'API Limit Reached'
            alert_message = f'You have used all <strong>{limit:,}</strong> API requests in your {plan_name} plan.'
            cta_text = 'Upgrade Now'
        elif threshold == 90:
            msg['Subject'] = f'⚠️ 90% API Usage - {plan_name}'
            alert_color = '#ff9800'
            alert_icon = '⚠️'
            alert_title = '90% Usage Alert'
            alert_message = f'You have used <strong>{used:,}</strong> of {limit:,} API requests ({threshold}%).'
            cta_text = 'Upgrade Plan'
        else:  # 80%
            msg['Subject'] = f'📊 80% API Usage - {plan_name}'
            alert_color = '#ffc107'
            alert_icon = '📊'
            alert_title = '80% Usage Alert'
            alert_message = f'You have used <strong>{used:,}</strong> of {limit:,} API requests ({threshold}%).'
            cta_text = 'View Plans'
        
        msg['From'] = Config.SMTP_EMAIL
        msg['To'] = email
        
        remaining = limit - used
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NutriSight AI</h1>
              <p style="color: #e0e0e0; margin: 5px 0 0 0; font-size: 14px;">API Usage Alert</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: {alert_color}; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                  {alert_icon} {alert_title}
                </div>
              </div>
              
              <h2 style="color: #2d5016; margin-top: 0;">Hi {name},</h2>
              <p style="color: #333; line-height: 1.6;">{alert_message}</p>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid {alert_color};">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">📊 Usage Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Current Plan:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #e0e0e0;">{plan_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Requests Used:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: {alert_color}; border-bottom: 1px solid #e0e0e0;">{used:,} / {limit:,}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #e0e0e0;">Remaining:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #e0e0e0;">{remaining:,} requests</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Usage:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: {alert_color};">{threshold}%</td>
                  </tr>
                </table>
                
                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin-top: 15px; overflow: hidden;">
                  <div style="background: {alert_color}; height: 100%; width: {threshold}%; border-radius: 10px;"></div>
                </div>
              </div>
              
              {f'''<div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">💡 What Happens Next?</h3>
                <p style="color: #666; margin: 10px 0; line-height: 1.6;">
                  Once you reach your limit, all API requests will be blocked until you upgrade your plan or wait for the next billing cycle.
                </p>
              </div>''' if threshold >= 90 else ''}
              
              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #2d5016; margin-top: 0; font-size: 18px;">🚀 Upgrade Options</h3>
                <ul style="color: #666; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>Starter:</strong> 10,000 requests/month - ₹499</li>
                  <li><strong>Professional:</strong> 100,000 requests/month - ₹1,499</li>
                  <li><strong>Enterprise:</strong> Unlimited requests - Custom pricing</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{Config.FRONTEND_URL}/api-pricing" style="background: #2d5016; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; margin-right: 10px;">{cta_text} →</a>
                <a href="{Config.FRONTEND_URL}/api-usage" style="background: #4a7c2c; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View Usage →</a>
              </div>
              
              <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  <strong>Need Help?</strong><br>
                  Contact our support team at api-support@nutrisight.ai
                </p>
              </div>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #2d5016; color: white;">
              <p style="margin: 0; font-size: 12px;">© 2024 NutriSight AI. All rights reserved.</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send usage alert to {email}: {str(e)}")
        return False

def send_diet_plan_email(email, patient_name, diet_plan_html, pdf_data=None):
    """Send diet plan report via email with optional PDF attachment"""
    try:
        msg = MIMEMultipart('mixed')
        msg['Subject'] = f'Your Personalized Diet Plan - {patient_name}'
        msg['From'] = Config.SMTP_EMAIL
        msg['To'] = email
        
        current_date = datetime.now().strftime('%B %d, %Y')
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🍽️ NutriSight AI</h1>
              <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">Your Personalized Diet Plan</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; background: #d4edda; color: #155724; padding: 12px 25px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                  ✓ Diet Plan Generated Successfully
                </div>
              </div>
              
              <h2 style="color: #6366f1; margin-top: 0;">Hi {patient_name},</h2>
              <p style="color: #333; line-height: 1.8; font-size: 15px;">
                Your personalized 7-day diet plan has been generated by our AI engine based on your health profile, 
                medical conditions, and dietary preferences. This plan is designed to help you achieve your health goals safely and effectively.
              </p>
              
              {f'''<div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50;">
                <h3 style="color: #2e7d32; margin-top: 0; font-size: 18px;">📎 PDF Report Attached</h3>
                <p style="color: #666; margin: 0; line-height: 1.6; font-size: 14px;">
                  Your complete diet plan has been attached as a PDF file. Download and print it for easy reference.
                </p>
              </div>''' if pdf_data else ''}
              
              <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #6366f1; margin-top: 0; font-size: 18px;">⚠️ Important Notice</h3>
                <p style="color: #666; margin: 0; line-height: 1.6; font-size: 14px;">
                  This diet plan is generated by an AI model and should be reviewed by a certified nutritionist or medical practitioner 
                  before implementation. Individual results may vary based on metabolism, activity level, and other factors.
                </p>
              </div>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #6366f1; margin-top: 0; font-size: 18px;">📋 Your Diet Plan Details</h3>
                {diet_plan_html}
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #6366f1; margin-top: 0; font-size: 18px;">💡 Tips for Success</h3>
                <ul style="color: #666; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                  <li>Follow the meal plan consistently for best results</li>
                  <li>Stay hydrated - drink 8-10 glasses of water daily</li>
                  <li>Maintain regular meal timings</li>
                  <li>Combine with regular physical activity</li>
                  <li>Monitor your progress weekly</li>
                  <li>Consult your doctor if you have any concerns</li>
                </ul>
              </div>
              
              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #6366f1; margin-top: 0; font-size: 18px;">📊 Track Your Progress</h3>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                  Log in to your NutriSight AI dashboard to track your daily food intake, monitor your progress, 
                  and get personalized recommendations based on your results.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{Config.FRONTEND_URL}/diet-engine" style="background: #6366f1; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; margin-right: 10px;">Generate New Plan →</a>
                <a href="{Config.FRONTEND_URL}/dashboard" style="background: #8b5cf6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View Dashboard →</a>
              </div>
              
              <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                  <strong>Need Help?</strong><br>
                  📧 Email: support@nutrisight.ai<br>
                  📞 Phone: +91-XXXXXXXXXX<br>
                  🌐 Website: <a href="{Config.FRONTEND_URL}" style="color: #6366f1;">nutrisight.ai</a>
                </p>
              </div>
              
              <p style="color: #999; font-size: 11px; line-height: 1.5; margin-top: 20px; text-align: center;">
                This diet plan was generated on {current_date}. Please save this email for your records.
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #6366f1; color: white;">
              <p style="margin: 0; font-size: 12px;">© 2024 NutriSight AI. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #e0e0e0;">Powered by AI & Machine Learning</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Attach PDF if provided
        if pdf_data:
            pdf_attachment = MIMEApplication(pdf_data, _subtype='pdf')
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=f'Diet_Plan_{patient_name}.pdf')
            msg.attach(pdf_attachment)
        
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send diet plan email to {email}: {str(e)}")
        return False
