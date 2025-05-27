# 🛡️ CHAMADA.AI SECURITY GUIDE

## 🚨 CRITICAL SECURITY FIXES IMPLEMENTED

### ✅ **FIXED: Flask Backend Security (`website_backend.py`)**

#### **1. CORS Protection**
- **Before**: `CORS(app)` - Allowed ANY website to call your API
- **After**: `CORS(app, origins=ALLOWED_ORIGINS, methods=['POST'])` - Restricted to specific domains

#### **2. Rate Limiting**
- **Added**: IP-based rate limiting (3 requests per 24 hours by default)
- **Configurable**: `MAX_REQUESTS_PER_IP` and `RATE_LIMIT_WINDOW` environment variables

#### **3. Input Validation**
- **Phone Numbers**: Validates Portuguese format (+351XXXXXXXXX)
- **Personas**: Whitelist validation against allowed personas
- **Customer Names**: Sanitizes dangerous characters, length limits

#### **4. Secure Logging**
- **Before**: Logged phone numbers and personal data in plain text
- **After**: Logs only non-sensitive identifiers and hashed data

#### **5. Production Security**
- **Before**: `debug=True` and `host='0.0.0.0'` in production
- **After**: `debug=False` and restricted host in production

### ✅ **FIXED: Agent Security (`outbound_agent.py`)**

#### **1. Environment Variables**
- **Before**: Hardcoded SIP trunk ID and phone numbers
- **After**: All sensitive values moved to environment variables

#### **2. Data Privacy**
- **Before**: Phone numbers and names sent to webhooks in plain text
- **After**: Sensitive data hashed before sending to external services

#### **3. Secure Logging**
- **Before**: Complete conversation transcripts logged in debug mode
- **After**: Removed detailed logging of personal conversations

#### **4. Webhook Security**
- **Added**: Timestamp headers for replay attack prevention
- **Improved**: Better error handling without exposing sensitive details

## 🔧 **ENVIRONMENT CONFIGURATION**

Create a `.env.local` file with these variables:

```bash
# REQUIRED - LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# REQUIRED - Telephony
SIP_TRUNK_ID=ST_your_trunk_id
CALLER_ID=+351your_number
DEFAULT_FALLBACK_PHONE=+351test_number

# SECURITY - CORS and Rate Limiting
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
MAX_REQUESTS_PER_IP=3
RATE_LIMIT_WINDOW=86400

# OPTIONAL - Webhooks
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your_id
MAKE_WEBHOOK_SECRET=your_32_char_secret

# PRODUCTION
FLASK_ENV=production
```

## 🚨 **IMMEDIATE ACTIONS REQUIRED**

### **1. Regenerate Compromised Keys**
The following were exposed in your code and need to be regenerated:
- ElevenLabs API Key: `sk_d94f2950348df3ba0e76092bbcf1e9d51fa5fe66c8904317`
- Agent ID: `tLYQ1n0EtQQHx8lqbcPT`
- Phone Number ID: `EcZm7zeCaXukBOPwwwSN`

### **2. Update Environment Variables**
Move all sensitive values from code to `.env.local`:
- SIP_TRUNK_ID
- CALLER_ID
- All API keys and secrets

### **3. Configure CORS**
Update `ALLOWED_ORIGINS` to include only your actual domains:
```bash
ALLOWED_ORIGINS=https://your-actual-domain.com,https://your-vercel-app.vercel.app
```

## 🛡️ **SECURITY FEATURES IMPLEMENTED**

### **Rate Limiting**
- **Per IP**: 3 requests per 24 hours (configurable)
- **Memory-based**: Uses in-memory storage (upgrade to Redis for production)
- **Graceful**: Returns 429 status with retry information

### **Input Validation**
```python
# Phone number validation
def validate_phone_number(phone: str) -> str:
    # Validates Portuguese format: +351XXXXXXXXX
    # Sanitizes input and normalizes format

# Persona validation  
def validate_persona(persona: str) -> str:
    # Whitelist validation against allowed personas
    # Prevents injection attacks

# Name sanitization
def validate_customer_name(name: str) -> str:
    # Removes dangerous characters: < > " '
    # Limits length to prevent abuse
```

### **Data Privacy**
```python
# Sensitive data hashing
def hash_sensitive_data(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()[:16]

# Applied to:
# - Phone numbers in webhooks
# - Customer names in logs
# - Personal identifiers
```

## 📊 **MONITORING & ALERTS**

### **Security Events to Monitor**
1. **Rate limit exceeded**: Multiple requests from same IP
2. **Invalid input attempts**: Malformed phone numbers or personas
3. **Webhook failures**: Failed transcript deliveries
4. **Authentication failures**: Invalid API keys or secrets

### **Log Analysis**
```bash
# Monitor for suspicious activity
grep "Rate limit exceeded" logs/app.log
grep "Invalid input" logs/app.log
grep "Authentication failed" logs/app.log
```

## 🔄 **NEXT STEPS: ADVANCED SECURITY**

### **Phase 2: Enhanced Protection**
1. **Database Rate Limiting**: Replace in-memory with Supabase/Redis
2. **API Key Authentication**: Add API key requirement for backend
3. **Request Signing**: HMAC signature validation
4. **Geographic Restrictions**: Limit to Portugal/EU only

### **Phase 3: Compliance & Monitoring**
1. **GDPR Compliance**: Data retention policies, user consent
2. **Security Dashboard**: Real-time monitoring of threats
3. **Automated Alerts**: Slack/email notifications for security events
4. **Penetration Testing**: Regular security audits

## ⚠️ **SECURITY CHECKLIST**

- [ ] Regenerated all exposed API keys
- [ ] Created `.env.local` with secure values
- [ ] Updated CORS origins to actual domains
- [ ] Tested rate limiting functionality
- [ ] Verified input validation works
- [ ] Confirmed sensitive data is hashed
- [ ] Set up monitoring for security events
- [ ] Documented incident response procedures

## 🆘 **INCIDENT RESPONSE**

If you suspect a security breach:

1. **Immediate**: Rotate all API keys and secrets
2. **Assess**: Check logs for unauthorized access
3. **Contain**: Block suspicious IPs if needed
4. **Notify**: Inform users if personal data was accessed
5. **Review**: Update security measures based on findings

## 📞 **SUPPORT**

For security questions or incidents:
- Review this guide first
- Check application logs
- Test security features in development
- Document any security concerns for future updates 