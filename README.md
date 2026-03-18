# Crail — Story Writing & Reading Platform

A production-grade, fully responsive story writing and reading platform.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| UI | shadcn/ui + Lucide React |
| Animation | Framer Motion |
| State | Zustand |
| Backend | Python FastAPI |
| Database | MongoDB |
| Media | Cloudinary |
| AI | Groq SDK (Llama-3) |

## Theme Colors

| Name | Hex | Role |
|------|-----|------|
| Crail | `#C15F3C` | Primary accent |
| Cloudy | `#B1ADA1` | Secondary / muted |
| Pampas | `#F4F3EE` | Background |

## Monorepo Structure

```
crail/
├── apps/
│   ├── web/          # React + Vite + TypeScript
│   └── api/          # Python FastAPI
└── packages/
    └── shared/       # Shared TypeScript types
```

## Getting Started

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Backend
```bash
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

### Web (.env)
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Crail
```

### API (.env)
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB=crail
JWT_SECRET=your_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GROQ_API_KEY=your_groq_key
```
