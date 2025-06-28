# AI Recipe Recommender

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **Personalized Recipe Generation:** Enter your available ingredients and let AI generate custom recipes for you.
- **Recipe Collections:** Save your favorite recipes to custom collections for easy access and organization.
- **Discover Recipes:** Browse and discover recipes shared by others.
- **Authentication:** Sign in to save and manage your recipes and collections (powered by Supabase).
- **Modern UI:** Beautiful, glassmorphic design using Tailwind CSS, with responsive layouts for all devices.
- **Form Handling:** Add, remove, and manage ingredients interactively. Select collections with checkboxes.
- **Data Fetching:** Real-time user authentication and collection management with Supabase. Recipes are generated via an async API call.
- **Routing:** Navigate between Home, Collections, and Discover pages using Next.js routing and `Link` components.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
