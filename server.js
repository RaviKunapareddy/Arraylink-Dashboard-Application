const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Determine if we're in development or production
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Log environment for debugging
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Running in ${dev ? 'development' : 'production'} mode`);

// Prepare the Next.js app
app.prepare()
  .then(() => {
    // Create the HTTP server
    const server = createServer((req, res) => {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;
      
      // Handle API routes and page requests
      handle(req, res, parsedUrl);
    });

    // Get port from environment variable or default to 3000
    const port = process.env.PORT || 3000;
    
    // Start the server
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on port ${port} - env: ${process.env.NODE_ENV}`);
    });
  })
  .catch((ex) => {
    console.error('An error occurred starting the server:');
    console.error(ex.stack);
    process.exit(1);
  });
