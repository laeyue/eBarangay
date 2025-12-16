# Portainer Deployment Guide with Nginx Proxy Manager (NPM)

This guide will help you deploy the eBarangay application to Portainer using Nginx Proxy Manager (NPM) as a reverse proxy.

## Prerequisites

1. **Portainer** installed and running
2. **Nginx Proxy Manager (NPM)** installed and running
3. **Docker** and **Docker Compose** installed on the server
4. Access to Portainer web UI

## Step 1: Verify NPM Network

First, ensure NPM is running and has created the `npm_default` network:

1. In Portainer, go to **Networks**
2. Verify that `npm_default` network exists
3. If it doesn't exist, create it with:
   ```bash
   docker network create npm_default
   ```

## Step 2: Prepare Environment Variables

Create an environment file or set environment variables in Portainer. You'll need the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://your-mongodb-host:27017/barangay-connect
# Or if using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/barangay-connect

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Service Configuration (Brevo/Sendinblue recommended)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_EMAIL=your-brevo-email@example.com
SMTP_PASSWORD=your-brevo-smtp-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Barangay Connect

# Frontend URL (will be your NPM proxy domain)
FRONTEND_URL=https://yourdomain.com
```

### Option A: Using Portainer Environment Variables

1. In Portainer, go to **Stacks** → **Add Stack**
2. Scroll down to **Environment variables** section
3. Add each variable using the **Add environment variable** button

### Option B: Using .env File

1. Create a `.env` file in your project root with the variables above
2. When deploying via Portainer, you can upload this file or copy its contents

## Step 3: Deploy the Stack in Portainer

1. **Log into Portainer**

2. **Navigate to Stacks**
   - Click on **Stacks** in the left sidebar
   - Click **Add stack**

3. **Configure the Stack**
   - **Name**: `ebarangay` (or your preferred name)
   - **Build method**: Select **Repository**
     - Repository URL: Your Git repository URL
     - Repository reference: `main` or `master`
     - Compose path: `docker-compose.yml`
   - OR select **Web editor** and paste the contents of `docker-compose.yml`

4. **Set Environment Variables**
   - Add all required environment variables from Step 2
   - Make sure `FRONTEND_URL` matches your domain (e.g., `https://ebarangay.yourdomain.com`)

5. **Deploy the Stack**
   - Click **Deploy the stack**
   - Wait for the build and deployment to complete
   - Check the logs to ensure both containers start successfully

## Step 4: Configure Nginx Proxy Manager

After the stack is deployed, configure NPM to proxy traffic to your containers.

### Frontend Proxy Host

1. **Log into Nginx Proxy Manager**

2. **Create Proxy Host for Frontend**
   - Click **Hosts** → **Proxy Hosts** → **Add Proxy Host**
   - **Details Tab**:
     - **Domain Names**: `ebarangay.yourdomain.com` (or your domain)
     - **Scheme**: `http`
     - **Forward Hostname/IP**: `ebarangay-frontend`
     - **Forward Port**: `80`
     - ✅ **Block Common Exploits**
     - ✅ **Websockets Support** (optional, for future real-time features)
   
   - **SSL Tab**:
     - Request SSL certificate with Let's Encrypt
     - Enable **Force SSL** and **HTTP/2 Support**
     - Click **Save**

### Backend Proxy Host (Optional - Only if you need direct API access)

If you want direct access to the backend API (not required since frontend proxies API calls):

1. **Create Proxy Host for Backend**
   - Click **Hosts** → **Proxy Hosts** → **Add Proxy Host**
   - **Details Tab**:
     - **Domain Names**: `api.yourdomain.com` (or `backend.yourdomain.com`)
     - **Scheme**: `http`
     - **Forward Hostname/IP**: `ebarangay-backend`
     - **Forward Port**: `5000`
     - ✅ **Block Common Exploits**
   
   - **SSL Tab**:
     - Request SSL certificate with Let's Encrypt
     - Enable **Force SSL** and **HTTP/2 Support**
     - Click **Save**

   **Note**: The frontend nginx already proxies `/api` requests to the backend, so a separate backend proxy is usually not necessary.

## Step 5: Update Frontend URL Environment Variable

After setting up the NPM proxy:

1. Update the `FRONTEND_URL` environment variable in Portainer:
   - Go to **Stacks** → Select your stack → **Editor**
   - Update `FRONTEND_URL` to match your NPM domain (e.g., `https://ebarangay.yourdomain.com`)
   - Click **Update the stack**

2. Restart the backend container:
   - Go to **Containers** → Find `ebarangay-backend` → **Restart**

## Step 6: Verify Deployment

1. **Check Container Status**
   - In Portainer, go to **Containers**
   - Verify both `ebarangay-frontend` and `ebarangay-backend` are running

2. **Check Logs**
   - Click on each container → **Logs**
   - Look for any errors or warnings

3. **Test the Application**
   - Visit your domain: `https://ebarangay.yourdomain.com`
   - Test API connectivity by logging in or accessing features
   - Check browser console for any API errors

## Architecture Overview

```
Internet
   ↓
Nginx Proxy Manager (Port 80/443)
   ↓
ebarangay-frontend:80 (nginx)
   ├─ Serves React App (/)
   └─ Proxies API requests (/api → ebarangay-backend:5000)
         ↓
   ebarangay-backend:5000 (Express.js)
      └─ MongoDB Database
```

## Network Configuration

- **npm_default**: External network shared with NPM (allows NPM to communicate with containers)
- **ebarangay_internal**: Internal network for container-to-container communication

## Troubleshooting

### Containers won't start

1. **Check network exists**:
   ```bash
   docker network ls | grep npm_default
   ```
   If missing, create it: `docker network create npm_default`

2. **Check environment variables**:
   - Ensure all required variables are set
   - Verify MongoDB URI is correct and accessible
   - Check JWT_SECRET is set

3. **Check logs**:
   - In Portainer, view container logs for errors
   - Common issues: MongoDB connection failures, missing environment variables

### Frontend can't reach backend

1. **Verify networks**:
   - Both containers should be on `npm_default` and `ebarangay_internal`
   - Check in Portainer → Stacks → Your stack → Inspect

2. **Test backend directly**:
   ```bash
   docker exec -it ebarangay-frontend wget -O- http://backend:5000/api/health
   ```

### NPM can't reach containers

1. **Verify container names**:
   - Frontend: `ebarangay-frontend`
   - Backend: `ebarangay-backend`
   - These must match what you configured in NPM

2. **Check network**:
   - Both containers must be on `npm_default` network
   - Verify in Portainer → Networks → npm_default → Inspect

### SSL Certificate Issues

1. **Check DNS**:
   - Ensure your domain points to the server's IP
   - Wait for DNS propagation (can take up to 24 hours)

2. **Check port forwarding**:
   - Ports 80 and 443 must be open and forwarded to NPM container

3. **Check certificate logs in NPM**:
   - View certificate status in NPM → SSL Certificates

## Updating the Application

1. **Pull latest changes**:
   - In Portainer → Stacks → Your stack → **Editor**
   - Update the compose file or repository reference
   - Click **Update the stack**

2. **Rebuild containers**:
   - Use **Recreate** option to force rebuild

## Backup Recommendations

1. **Database**: Set up MongoDB backups
2. **Environment variables**: Save a copy of your .env file securely
3. **Configuration**: Export your NPM proxy host configurations

## Security Notes

1. **Change default secrets**: Use strong, unique values for JWT_SECRET
2. **Keep containers updated**: Regularly update base images
3. **Monitor logs**: Set up log monitoring for suspicious activity
4. **Firewall**: Only expose ports 80/443, keep 5000 and 8080 internal
5. **SSL**: Always use HTTPS in production (handled by NPM)

## Support

For issues or questions:
1. Check container logs in Portainer
2. Verify network connectivity
3. Test API endpoints directly
4. Review NPM access logs

