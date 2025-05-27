# 🚀 DIGITAL OCEAN SERVER DEPLOYMENT GUIDE

## 🔧 **REQUIRED SERVER UPDATES**

### **1. Update Environment Variables**

SSH into your Digital Ocean server and update the `.env.local` file:

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to your project directory
cd /path/to/your/chamada-ai-project

# Edit environment file
nano .env.local
```

**Add these NEW security variables:**

```bash
# ============================================================================
# PRODUCTION SECURITY (NEW - REQUIRED)
# ============================================================================
FLASK_ENV=production
PRODUCTION_API_KEY=703398C0DDDD4FDB12C64524374C2CCAC85D86715BC106EFCFCBA8E93744B04F

# CORS Configuration
ALLOWED_ORIGINS=https://chamada.ai,https://chamada-ai.vercel.app

# Rate Limiting
MAX_REQUESTS_PER_IP=3
RATE_LIMIT_WINDOW=86400

# ============================================================================
# EXISTING VARIABLES (Keep these)
# ============================================================================
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# ⚠️ REGENERATE THESE (They were exposed)
ELEVENLABS_API_KEY=sk_NEW_elevenlabs_api_key
ELEVEN_AGENT_ID=NEW_agent_id
ELEVEN_AGENT_PHONE_NUMBER_ID=NEW_phone_number_id

SIP_TRUNK_ID=ST_your_sip_trunk_id
CALLER_ID=+351your_caller_id
DEFAULT_FALLBACK_PHONE=+351your_fallback_number

MAKE_WEBHOOK_URL=https://hook.eu2.make.com/7mi32f1hxbwr663iwd9dtw2aar17kzdc
```

### **2. Update Python Backend File**

Upload the updated `website_backend.py` to your server:

```bash
# From your local machine, copy the updated backend
scp website_backend.py root@your-server-ip:/path/to/your/project/

# Or edit directly on server
nano website_backend.py
```

### **3. Update Outbound Agent File**

Upload the updated `outbound_agent.py` to your server:

```bash
# Copy the updated agent file
scp outbound_agent.py root@your-server-ip:/path/to/your/project/
```

### **4. Update Systemd Service (If Using)**

If you're running the backend as a systemd service, update the service file:

```bash
# Edit the service file
sudo nano /etc/systemd/system/chamada-backend.service
```

**Updated service file:**

```ini
[Unit]
Description=Chamada.ai Backend Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/your/project
Environment=PATH=/usr/bin:/usr/local/bin
Environment=FLASK_ENV=production
EnvironmentFile=/path/to/your/project/.env.local
ExecStart=/usr/bin/python3 website_backend.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Reload and restart the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart chamada-backend
sudo systemctl status chamada-backend
```

### **5. Update LiveKit Agent Service**

```bash
# Edit agent service file
sudo nano /etc/systemd/system/chamada-agent.service
```

**Updated agent service:**

```ini
[Unit]
Description=Chamada.ai LiveKit Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/your/project
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=/path/to/your/project/.env.local
ExecStart=/usr/bin/python3 -m livekit.agents.cli start outbound_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Restart agent service:**

```bash
sudo systemctl restart chamada-agent
sudo systemctl status chamada-agent
```

## 🔐 **VERCEL ENVIRONMENT VARIABLES**

### **Add to Vercel Dashboard:**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
# Production API Configuration
PRODUCTION_API_URL=http://YOUR_DIGITAL_OCEAN_IP:5001/api/start_call
PRODUCTION_API_KEY=703398C0DDDD4FDB12C64524374C2CCAC85D86715BC106EFCFCBA8E93744B04F

# Webhook Configuration
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/7mi32f1hxbwr663iwd9dtw2aar17kzdc

# Optional: Supabase (if using rate limiting)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 **TESTING THE DEPLOYMENT**

### **1. Test Backend Authentication**

```bash
# This should FAIL (no auth)
curl -X POST http://YOUR_SERVER_IP:5001/api/start_call \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+351123456789","persona":"clinica"}'

# Expected: 401 Unauthorized
```

### **2. Test with Authentication**

```bash
# This should WORK (with auth)
curl -X POST http://YOUR_SERVER_IP:5001/api/start_call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 703398C0DDDD4FDB12C64524374C2CCAC85D86715BC106EFCFCBA8E93744B04F" \
  -d '{"phone_number":"+351123456789","persona":"clinica"}'

# Expected: 200 OK with job details
```

### **3. Test Rate Limiting**

```bash
# Make 4 requests quickly - 4th should be blocked
for i in {1..4}; do
  curl -X POST http://YOUR_SERVER_IP:5001/api/start_call \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer 703398C0DDDD4FDB12C64524374C2CCAC85D86715BC106EFCFCBA8E93744B04F" \
    -d '{"phone_number":"+351123456789","persona":"clinica"}'
  echo "Request $i completed"
done

# Expected: First 3 succeed, 4th returns 429 Rate Limit Exceeded
```

## 🚨 **CRITICAL SECURITY ACTIONS**

### **1. Regenerate Exposed API Keys**

**ElevenLabs:**
1. Go to ElevenLabs dashboard
2. Regenerate API key (the old one was exposed)
3. Update agent ID and phone number ID
4. Update `.env.local` on server

**LiveKit:**
1. Check if any LiveKit credentials were exposed
2. Regenerate if necessary

### **2. Firewall Configuration**

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 5001  # Backend API
sudo ufw allow 80    # HTTP (if using)
sudo ufw allow 443   # HTTPS (if using)
sudo ufw enable
```

### **3. Monitor Logs**

```bash
# Monitor backend logs
sudo journalctl -u chamada-backend -f

# Monitor agent logs  
sudo journalctl -u chamada-agent -f

# Check for authentication failures
grep "Invalid API key" /var/log/syslog
```

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Updated `.env.local` with new security variables
- [ ] Set `FLASK_ENV=production`
- [ ] Added `PRODUCTION_API_KEY`
- [ ] Configured `ALLOWED_ORIGINS`
- [ ] Regenerated exposed ElevenLabs keys
- [ ] Updated systemd services
- [ ] Restarted all services
- [ ] Added Vercel environment variables
- [ ] Tested authentication (should fail without key)
- [ ] Tested rate limiting (should block after 3 requests)
- [ ] Verified no API keys in browser network tab

## 🔄 **DEPLOYMENT COMMANDS SUMMARY**

```bash
# 1. Update files
scp website_backend.py root@YOUR_SERVER_IP:/path/to/project/
scp outbound_agent.py root@YOUR_SERVER_IP:/path/to/project/

# 2. Update environment
nano .env.local  # Add new security variables

# 3. Restart services
sudo systemctl restart chamada-backend
sudo systemctl restart chamada-agent

# 4. Verify services
sudo systemctl status chamada-backend
sudo systemctl status chamada-agent

# 5. Test security
curl -X POST http://YOUR_SERVER_IP:5001/api/start_call \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+351123456789","persona":"clinica"}'
# Should return 401 Unauthorized
```

Your system will be **production-ready and secure** after these updates! 🛡️ 