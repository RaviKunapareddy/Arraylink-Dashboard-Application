# ArrayLink AI - Prospect Dashboard

A dashboard for managing sales prospects and automating outreach for ArrayLink AI, an AI-powered sales automation tool.

## Features

- View a list of hotel prospects
- See last purchased products and recommended new products
- Initiate outreach to prospects with a single click
- AI-powered voice calls using Twilio and OpenAI GPT-4

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- Next.js for the frontend
- React for UI components
- Express for API endpoints
- Twilio Programmable Voice with Amazon Polly Neural Voices (integration planned)
- OpenAI GPT-4 for conversational AI (integration planned)

## Deployment

### Azure Deployment Instructions

1. **Prepare your environment variables**
   - Copy `.env.sample` to `.env.local` and fill in your Twilio credentials
   - For production, update the BASE_URL to your Azure app URL

2. **Create a GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/arraylink-dashboard.git
   git push -u origin main
   ```

3. **Create an Azure App Service**
   - Go to Azure Portal: https://portal.azure.com
   - Navigate to App Services → Create
   - Fill out the form:
     - Name: arraylink-dashboard
     - Runtime stack: Node 18 LTS
     - Operating System: Linux
     - Region: Choose the closest to you
     - Pricing Plan: Free (F1) for testing, or Basic B1 for production

4. **Set up GitHub Actions deployment**
   - In the Azure Portal, go to your App Service
   - Click on "Get publish profile" and download the file
   - In GitHub, go to your repository settings → Secrets → New repository secret
   - Name: AZURE_WEBAPP_PUBLISH_PROFILE
   - Value: Paste the entire content of the publish profile file

5. **Configure Environment Variables in Azure**
   - In the Azure Portal, go to App Service → Configuration → Application settings
   - Add all the variables from your `.env.local` file
   - Update BASE_URL to your Azure app URL (e.g., https://arraylink-dashboard.azurewebsites.net)
   - Set NODE_ENV to production

6. **Push changes to GitHub**
   - The GitHub Actions workflow will automatically build and deploy your app to Azure

Your app will be available at: https://arraylink-dashboard.azurewebsites.net (or your custom domain)