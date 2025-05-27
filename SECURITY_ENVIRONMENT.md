# 🔐 SECURITY ENVIRONMENT CONFIGURATION

## 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

### **1. Regenerate ALL Exposed API Keys**
The following keys were found hardcoded and must be regenerated immediately:
- ✅ ElevenLabs API Key: `sk_d94f2950348df3ba0e76092bbcf1e9d51fa5fe66c8904317`
- ✅ Agent ID: `tLYQ1n0EtQQHx8lqbcPT`
- ✅ Phone Number ID: `EcZm7zeCaXukBOPwwwSN`

### **2. Create Secure .env.local File**

```bash
# ============================================================================
# CHAMADA.AI ENVIRONMENT CONFIGURATION
# ============================================================================
# Copy this template to .env.local and fill in your actual values
# NEVER commit .env.local to version control!

# ============================================================================
# LIVEKIT CONFIGURATION (REQUIRED)
# ============================================================================
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# ============================================================================
# TELEPHONY CONFIGURATION (REQUIRED)
# ============================================================================
SIP_TRUNK_ID=ST_your_sip_trunk_id
CALLER_ID=+351your_caller_id
DEFAULT_FALLBACK_PHONE=+351your_fallback_number

# ============================================================================
# ELEVENLABS CONFIGURATION (REQUIRED FOR ELEVENLABS CALLS)
# ============================================================================
ELEVENLABS_API_KEY=sk_your_NEW_elevenlabs_api_key
ELEVEN_AGENT_ID=your_NEW_agent_id
ELEVEN_AGENT_PHONE_NUMBER_ID=your_NEW_phone_number_id

# ============================================================================
# SECURITY CONFIGURATION (REQUIRED FOR PRODUCTION)
# ============================================================================
# Generate with: openssl rand -hex 32
PRODUCTION_API_KEY=your_32_character_random_api_key

# CORS allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com,https://your-app.vercel.app

# Rate limiting configuration
MAX_REQUESTS_PER_IP=3
RATE_LIMIT_WINDOW=86400

# ============================================================================
# WEBHOOK CONFIGURATION (OPTIONAL)
# ============================================================================
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your_webhook_id
MAKE_WEBHOOK_SECRET=your_webhook_secret_for_auth
WEBHOOK_TIMEOUT=30
WEBHOOK_RETRIES=3

# ============================================================================
# DATABASE CONFIGURATION (OPTIONAL - FOR ADVANCED RATE LIMITING)
# ============================================================================
# Supabase configuration for rate limiting
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ============================================================================
# PRODUCTION CONFIGURATION
# ============================================================================
# Set to 'production' to enable production security features
FLASK_ENV=development

# Production backend URL (for Vercel -> Digital Ocean)
PRODUCTION_API_URL=https://your-server.com/api/start_call

# Development backend URL (for local testing)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

## 🛡️ **SECURITY FIXES IMPLEMENTED**

### ✅ **Fixed: API Key Exposure**
- Removed hardcoded fallback API keys
- Added environment variable validation
- Service fails gracefully if keys missing

### ✅ **Fixed: CORS Misconfiguration**
- Restricted origins to specific domains
- Limited methods to POST and OPTIONS only
- Disabled credentials for security

### ✅ **Fixed: Production Authentication**
- Added mandatory API key for production calls
- Implemented Bearer token authentication
- Added request source tracking

### ✅ **Fixed: Backend Security**
- Added authentication middleware
- Improved error handling
- Enhanced logging without sensitive data

## 🔧 **DEPLOYMENT CHECKLIST**

### **Development Environment**
- [ ] Create `.env.local` with all required variables
- [ ] Test API key validation (should fail without keys)
- [ ] Test rate limiting functionality
- [ ] Verify CORS restrictions work

### **Production Environment**
- [ ] Set `FLASK_ENV=production`
- [ ] Generate secure `PRODUCTION_API_KEY`
- [ ] Configure `ALLOWED_ORIGINS` with actual domains
- [ ] Set up monitoring for authentication failures
- [ ] Test end-to-end call flow

### **Security Verification**
- [ ] Confirm no hardcoded keys in deployed code
- [ ] Test that unauthenticated requests are rejected
- [ ] Verify rate limiting prevents abuse
- [ ] Check that sensitive data is not logged

## 🚨 **CRITICAL SECURITY NOTES**

### **Environment Variable Security**
```bash
# ✅ SECURE: Server-side only
ELEVENLABS_API_KEY=sk_...
PRODUCTION_API_KEY=...

# ⚠️ EXPOSED: Client-side visible (use carefully)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **API Key Generation**
```bash
# Generate secure API key
openssl rand -hex 32

# Example output
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### **CORS Configuration**
```bash
# ✅ SECURE: Specific domains
ALLOWED_ORIGINS=https://chamada-ai.vercel.app,https://your-domain.com

# ❌ INSECURE: Wildcard
ALLOWED_ORIGINS=*
```

## 📊 **MONITORING & ALERTS**

### **Security Events to Monitor**
1. **Authentication failures**: Invalid API keys
2. **Rate limit exceeded**: Potential abuse attempts
3. **CORS violations**: Unauthorized domain requests
4. **Environment variable missing**: Service degradation

### **Log Analysis Commands**
```bash
# Monitor authentication failures
grep "Invalid API key" logs/app.log

# Check rate limiting
grep "Rate limit exceeded" logs/app.log

# Monitor CORS issues
grep "CORS" logs/app.log
```

## 🆘 **INCIDENT RESPONSE**

If you suspect a security breach:

1. **Immediate**: Regenerate all API keys
2. **Assess**: Check logs for unauthorized access
3. **Contain**: Update CORS origins if needed
4. **Monitor**: Watch for continued abuse attempts
5. **Document**: Record incident for future prevention

## 🔄 **NEXT STEPS**

1. **Implement these fixes immediately**
2. **Test in development environment**
3. **Deploy to production with new keys**
4. **Set up monitoring and alerts**
5. **Regular security audits** 