# Step 1: Clean previous builds and caches
rm -rf .next node_modules/.cache tsconfig.tsbuildinfo

# Step 2: Install missing type packages (if needed)
npm install --save-dev @types/node@20.14.14 @types/react@18.3.3 @types/react-dom@18.3.0

# Step 3: Ensure testing packages are installed
npm install --save-dev @testing-library/jest-dom@6.4.8 @testing-library/react@16.0.0 jest@29.7.0 jest-environment-jsdom@29.7.0

# Step 4: Install bundle analyzer if you want to use it
npm install --save-dev @next/bundle-analyzer@14.2.5

# Step 5: Delete the duplicate next.config.ts if it exists
rm -f next.config.ts

# Step 6: Verify TypeScript works
npm run type-check

# Step 7: Start development server
npm run dev
