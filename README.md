# OptimaCook

This is a Next.js project bootstrapped with `create-next-app`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Local Development Authentication

To use the AI features that rely on Vertex AI during local development, you need to provide application default credentials. Run the following command in your terminal:

```bash
gcloud auth application-default login
```

This command will open a browser window for you to log in with your Google account. Once authenticated, your local application will have the necessary permissions to communicate with Google Cloud services, just like it does in production. You only need to do this once per machine.
