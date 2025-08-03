# Deployment Guide

This guide covers multiple deployment options for the Project Management SaaS application.

## Prerequisites

- Git repository with your code
- Accounts on deployment platforms (as needed)

## Option 1: Docker Deployment (Recommended for VPS/Self-hosting)

### Local Docker Deployment

1. Clone the repository
2. Create a `.env` file in the root directory:
   ```bash
   JWT_SECRET=your-very-secure-secret-key
   ```

3. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application at `http://localhost`

### Production Docker Deployment

For production, update the `docker-compose.yml`:
- Change ports as needed
- Add SSL/TLS termination (use nginx-proxy or Traefik)
- Use environment variables for sensitive data

## Option 2: Vercel (Frontend) + Railway (Backend)

### Deploy Backend to Railway

1. Push your code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. Create a new project and connect your GitHub repo
4. Select the `/server` directory as the root
5. Add environment variables:
   - `JWT_SECRET`: Generate a secure secret
   - `NODE_ENV`: production
6. Deploy and copy the deployment URL

### Deploy Frontend to Vercel

1. Sign up at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the root directory to `/client`
4. Add environment variable:
   - `VITE_API_URL`: Your Railway backend URL + `/api`
5. Deploy

## Option 3: Render.com (Full Stack)

### Backend on Render

1. Sign up at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set root directory to `/server`
5. Build Command: `npm install`
6. Start Command: `node src/index.js`
7. Add environment variables:
   - `JWT_SECRET`: Generate a secure secret
   - `NODE_ENV`: production
8. Create a persistent disk for SQLite database

### Frontend on Render

1. Create another Web Service for frontend
2. Set root directory to `/client`
3. Build Command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable:
   - `VITE_API_URL`: Your backend service URL + `/api`

## Option 4: Heroku Deployment

### Prepare for Heroku

1. Create a `Procfile` in the server directory:
   ```
   web: node src/index.js
   ```

2. Update `package.json` to specify Node version:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

### Deploy to Heroku

```bash
# Install Heroku CLI
# Create a new Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## Option 5: AWS/GCP/Azure

For cloud platforms, you can:
1. Use their container services (ECS, Cloud Run, Container Instances)
2. Deploy the Docker images created above
3. Set up a managed database (RDS, Cloud SQL) instead of SQLite for production

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens (REQUIRED - use a strong secret)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: SQLite database path

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (e.g., https://your-backend.com/api)

## Post-Deployment Checklist

- [ ] Change JWT_SECRET to a secure value
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for your domain
- [ ] Set up monitoring (e.g., UptimeRobot)
- [ ] Configure backups for the database
- [ ] Set up error logging (e.g., Sentry)
- [ ] Test all features in production

## Database Considerations

The application uses SQLite by default, which is suitable for small to medium deployments. For larger scale:

1. **PostgreSQL**: Modify the backend to use PostgreSQL with Sequelize
2. **MySQL**: Similar modification needed
3. **MongoDB**: Would require significant code changes

## Scaling Considerations

1. **Frontend**: Can be served from CDN (Cloudflare, AWS CloudFront)
2. **Backend**: Can be horizontally scaled with a load balancer
3. **Database**: Migrate from SQLite to PostgreSQL/MySQL for better concurrency
4. **File Storage**: Add S3/Cloud Storage for file attachments

## Troubleshooting

### CORS Issues
- Ensure the backend CORS configuration includes your frontend domain
- Check that API_URL in frontend matches backend URL

### Database Issues
- Ensure the database file has proper write permissions
- For Docker, ensure the volume is properly mounted

### Authentication Issues
- Verify JWT_SECRET is the same across all instances
- Check that cookies/localStorage are enabled in browsers