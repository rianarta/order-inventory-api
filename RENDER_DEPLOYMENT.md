# Deploy to Render - Step by Step Guide

## Prerequisites
- GitHub account
- Render account (free tier available)

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Ready for Render deployment"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/order-inventory-system.git
git branch -M main
git push -u origin main
```

## Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `order-inventory-db`
   - **Database**: `order_inventory`
   - **User**: `postgres`
   - **Plan**: Free tier
4. Click **Create Database**
5. Wait for status to become **Available**
6. Copy the **Internal Database URL** (you'll need this later)

## Step 3: Create Redis on Render (Optional but Recommended)

1. Click **New +** → **Redis**
2. Configure:
   - **Name**: `order-inventory-redis`
   - **Plan**: Free tier
3. Click **Create Redis**
4. Wait for status to become **Available**
5. Copy the **Internal Connection URL**

## Step 4: Deploy the Application

### Option A: Deploy from GitHub (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select your repository `order-inventory-system`
5. Configure the web service:
   - **Name**: `order-inventory-system`
   - **Region**: Singapore (or nearest to you)
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Plan**: Free

6. Add Environment Variables:
   ```
   SPRING_PROFILES_ACTIVE = production
   SERVER_PORT = 10000
   DB_HOST = [Your PostgreSQL Internal Host]
   DB_PORT = 5432
   DB_NAME = order_inventory
   DB_USERNAME = postgres
   DB_PASSWORD = [Your PostgreSQL Password]
   REDIS_HOST = [Your Redis Internal Host]
   REDIS_PORT = 6379
   CACHE_TYPE = redis
   ```

7. Click **Create Web Service**
8. Wait for deployment (takes 5-10 minutes on first deploy)

### Option B: Deploy with Blueprint (render.yaml)

1. Push the `render.yaml` file to your GitHub repository
2. Go to Render Dashboard
3. Click **New +** → **Blueprint**
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file
6. Configure the environment variables in the Render dashboard:
   - `DB_HOST` - PostgreSQL internal host
   - `DB_NAME` - order_inventory
   - `DB_USERNAME` - postgres
   - `DB_PASSWORD` - Your PostgreSQL password
   - `REDIS_HOST` - Redis internal host
7. Click **Apply Changes**

## Step 5: Verify Deployment

1. Once deployed, click on your web service
2. Check the **Logs** tab for any errors
3. Click the **URL** to open your application
4. Test the health endpoint: `https://your-app.onrender.com/actuator/health`

## Application URLs

- **Application**: `https://order-inventory-system.onrender.com`
- **Health Check**: `https://order-inventory-system.onrender.com/actuator/health`
- **API Endpoint**: `https://order-inventory-system.onrender.com/api/products`

## Troubleshooting

### Application Won't Start
- Check logs for error messages
- Verify all environment variables are set correctly
- Ensure PostgreSQL and Redis are available

### Database Connection Error
- Verify `DB_HOST` is the internal hostname (not the external one)
- Check that PostgreSQL is in the same region as your web service
- Verify database credentials

### Redis Connection Error
- If you don't want to use Redis, set `CACHE_TYPE = simple`
- This will use in-memory caching instead

### Port Error
- Make sure `SERVER_PORT = 10000` is set
- Render requires apps to listen on port 10000

## Cost Information

- **Render Free Tier**:
  - PostgreSQL: Free (shared CPU, 1GB storage, 90 days max)
  - Redis: Free (30MB max)
  - Web Service: Free (750 hours/month, spins down after 15 min inactivity)

## Useful Render Commands

```bash
# View logs
render logs show --service=order-inventory-system

# Restart service
render deploy --service=order-inventory-system
```

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure SSL (automatic on Render)
3. Set up CI/CD for automatic deployments
4. Monitor application metrics in Render dashboard

## Support

- Render Documentation: https://render.com/docs
- Spring Boot on Render: https://render.com/docs/deploy-spring-boot
