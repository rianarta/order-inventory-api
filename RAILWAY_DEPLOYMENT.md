# Deploy to Railway - Step by Step Guide

## Prerequisites
- GitHub account
- Railway account (free tier available) - https://railway.app

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Ready for Railway deployment"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/order-inventory-system.git
git branch -M main
git push -u origin main
```

## Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Connect your GitHub account if not already connected
4. Select your repository `order-inventory-system`
5. Railway will auto-detect the `Dockerfile`

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **Add Plugin** (+) → **PostgreSQL**
2. Wait for PostgreSQL to be provisioned
3. Railway will automatically set `DATABASE_URL` environment variable

## Step 4: Add Redis (Optional but Recommended)

1. Click **Add Plugin** (+) → **Redis**
2. Wait for Redis to be provisioned
3. Railway will automatically set `REDIS_URL` environment variable

## Step 5: Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add/Update these variables:

   ```
   SERVER_PORT = 8080
   SPRING_PROFILES_ACTIVE = production
   DB_HOST = localhost
   DB_PORT = 5432
   DB_NAME = railway
   DB_USERNAME = postgres
   DB_PASSWORD = [Leave empty - use DATABASE_URL instead]
   REDIS_HOST = localhost
   REDIS_PORT = 6379
   CACHE_TYPE = simple
   ```

   **Important**: Spring Boot can parse `DATABASE_URL` automatically, so you may not need individual DB_* variables.

3. For Redis, add:
   ```
   REDIS_URL = [Your Redis connection URL from Railway]
   ```

## Step 6: Configure Startup Command

1. Go to **Settings** → **Start Command**
2. Railway should auto-detect from Dockerfile
3. If not, add:
   ```
   java -jar -Xms256m -Xmx512m target/order-inventory-system-1.0.0.jar
   ```

## Step 7: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click **Deploy** to trigger manual deployment
3. Wait for build and deployment to complete (5-10 minutes)
4. Check the **Logs** tab for any errors

## Step 8: Access Your Application

1. Once deployed, click on the **Deployment**
2. Find the **Networking** section
3. Click **Generate Domain** to get a public URL
4. Your app will be available at: `https://order-inventory-system.up.railway.app`

## Alternative: Set Environment Variables Programmatically

Railway provides database URLs in different formats. Update your application.yml:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:order_inventory}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
  
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
```

For Railway, set:
- `DB_HOST` = extracted from `DATABASE_URL`
- `DB_PORT` = 5432
- `DB_NAME` = extracted from `DATABASE_URL`
- `DB_USERNAME` = extracted from `DATABASE_URL`
- `DB_PASSWORD` = extracted from `DATABASE_URL`

## Health Check

Add this to your application to verify it's running:

```bash
curl https://your-app.up.railway.app/actuator/health
```

## Troubleshooting

### Application Won't Start
- Check logs for error messages
- Verify all environment variables are set correctly
- Ensure PostgreSQL is available and connected

### Database Connection Error
- Make sure `DATABASE_URL` is properly set
- Check that PostgreSQL plugin is added to your project
- Verify database exists and is accessible

### Redis Connection Error
- If you don't want to use Redis, set `CACHE_TYPE = simple`
- This will use in-memory caching instead

### Port Configuration
- Railway uses port from `SERVER_PORT` environment variable
- Default is 8080 for most frameworks
- Make sure your Dockerfile exposes the correct port

## Cost Information

- **Railway Free Tier**:
  - $5 credit/month (expires)
  - Usage-based pricing after that
  - PostgreSQL: ~$5-7/month
  - Redis: ~$5/month
  - Compute: ~$5-10/month
  - **Note**: Free trial requires credit card

## Connect to Database (Optional)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Open PostgreSQL shell
railway run psql
```

## Useful Railway Commands

```bash
# View logs
railway logs

# Redeploy
railway up

# Open in browser
railway open

# Add environment variable
railway variables set KEY=value
```

## Connect to Existing Services

If you have PostgreSQL or Redis from other providers:

1. Go to **Settings** → **Variables**
2. Add these manually:
   - `DATABASE_URL` = your PostgreSQL connection string
   - `REDIS_URL` = your Redis connection string

## Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **Generate Domain** or add custom domain
3. Railway provides free SSL certificate

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure environment variables for production
3. Monitor usage in Railway dashboard
4. Set up alerts for high usage

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/railwayapp/railway

## Quick Tips

1. **Use `.env` file locally** - Railway can import from `.env`
2. **Monitor logs** - Railway logs are real-time
3. **Use templates** - Railway has templates for common stacks
4. **Preview environments** - Each PR can have its own preview
5. **Variables are encrypted** - Sensitive data is encrypted at rest

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL added
- [ ] Redis added (optional)
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Health check passed
- [ ] Domain generated
- [ ] Application accessible
