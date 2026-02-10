// This will fail because we can't make authenticated Vercel API calls this way
// Instead, manually set MONGO_URI via Vercel dashboard:
// https://vercel.com/daniel-wundengbas-projects/backend/settings/environment-variables
//
// Add new env var:
// Name: MONGO_URI
// Value: mongodb+srv://mrwundengba:Z5wi49MBJ3qEcfVk@projects.nbs4iqw.mongodb.net/school-placement?retryWrites=true&w=majority&appName=Projects
// Environment: Production
// Click "Add"
// Redeploy

console.log(`
To fix MongoDB connection, manually set env var in Vercel dashboard:

1. Go to: https://vercel.com/daniel-wundengbas-projects/backend/settings/environment-variables
2. Click "Add New..."
3. Set:
   - Name: MONGO_URI
   - Value: mongodb+srv://mrwundengba:Z5wi49MBJ3qEcfVk@projects.nbs4iqw.mongodb.net/school-placement?retryWrites=true&w=majority&appName=Projects
   - Select Environment: Production
4. Click "Add"
5. Go to Deployments and redeploy the latest commit
6. Test with: curl https://backend-seven-ashen-18.vercel.app/api/diagnose
`)
