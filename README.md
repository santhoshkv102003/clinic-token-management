# Clinic Token System

A full-stack React TypeScript application for managing clinic patient tokens and appointments.

## 🚀 Features

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend**: Express.js API server
- **Real-time**: Patient queue management
- **Admin Panel**: Complete administrative interface
- **Responsive**: Mobile-friendly design

## 📁 Project Structure

```
clinic-token-System/
├── src/                    # Frontend React code
├── server/                 # Backend Express server
├── public/                 # Static assets
├── dist/                   # Production build
├── env.development         # Development environment variables
├── env.production          # Production environment variables
└── render.yaml            # Render deployment configuration
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/santhoshkv102003/clinic-token-management.git
   cd clinic-token-System
   ```

2. **Install all dependencies (Frontend + Backend)**
   ```bash
   npm run install:all
   ```

### Running the Application

#### Option 1: Frontend Only (Current Setup)
```bash
npm run dev
```
- Frontend runs on: http://localhost:8080
- Uses local storage for data persistence

#### Option 2: Full Stack (Frontend + Backend)
```bash
npm run dev:full
```
- Frontend runs on: http://localhost:8080
- Backend API runs on: http://localhost:3001
- API calls are proxied through Vite

#### Option 3: Run Separately
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

## 🔧 Available Scripts

### Frontend Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts
- `npm run server:dev` - Start backend development server
- `npm run server:start` - Start backend production server
- `npm run server:install` - Install backend dependencies

### Full Stack Scripts
- `npm run dev:full` - Start both frontend and backend
- `npm run install:all` - Install all dependencies

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Token Management
- `GET /api/tokens` - Get all tokens
- `POST /api/tokens` - Create new token
- `PUT /api/tokens/:id/next` - Call next patient

## 🚀 Deployment

### Render Deployment

1. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository

2. **Deploy Backend**
   - Create new Web Service
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm run server:start`

3. **Deploy Frontend**
   - Create new Static Site
   - Build Command: `npm run build`
   - Publish Directory: `dist`

### Environment Variables

#### Development
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_ENV=development
```

#### Production
```bash
VITE_API_URL=https://your-backend-api.com
VITE_APP_ENV=production
```

## 🎨 UI Components

Built with Shadcn/ui components:
- Buttons, Cards, Dialogs
- Forms and Inputs
- Navigation and Layout
- Toast notifications

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS for styling
- Responsive breakpoints
- Touch-friendly interface

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Input validation
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
