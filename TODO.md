# TODO List for Fixing MIME Type Errors in Home.js

- [x] Update react-dropzone accept prop in Home.js to use object format: { 'image/*': [] }

# TODO List for Fixing 403 Forbidden Error

- [x] Update API endpoint in Home.js from '/api/admins' to '/api/v1/admin'
- [x] Update proxy in frontend/package.json to 'http://localhost:3001'
- [x] Update CORS origin in backend/index.js to 'http://localhost:3001'

# TODO List for Fixing Remaining Console Errors

- [x] Update index.js to use createBrowserRouter with future flags to suppress React Router warnings
- [x] Add favicon.ico to frontend/public/ to resolve 403 error
