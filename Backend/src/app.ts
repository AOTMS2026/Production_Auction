import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.ts';
import authRoutes from './modules/auth/auth.routes.ts';
import auctionRoutes from './modules/auctions/auction.routes.ts';
import adminRoutes from './modules/auctions/admin.routes.ts';

const app: Express = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Initialize Database Connection
connectDatabase();

// Middleware
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://auction.aotms.com'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for development & staging
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' })); // Support base64 profile image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import http from 'http';
import teamRoutes from './modules/teams/team.routes.ts';
import playerRoutes from './modules/players/player.routes.ts';
import formTemplateRoutes from './modules/form-builder/form-template.routes.ts';
import formSubmissionRoutes from './modules/form-submissions/form-submission.routes.ts';
import sponsorRoutes from './modules/sponsors/sponsor.routes.ts';
import sessionRoutes from './modules/auction-sessions/auction-session.routes.ts';
import { initSocket } from './realtime/socket.ts';

// Base System Health Ping
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Auction Platform API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Authentication Module under /api/v1/auth (README.md standard) and /api/auth (alias)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Mount Auction Management & Access Request Module (README.md standard)
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Mount Teams, Players, Dynamic Forms, Submissions & Sponsors
app.use('/api/v1/auctions/:auctionId/teams', teamRoutes);
app.use('/api/auctions/:auctionId/teams', teamRoutes);
app.use('/api/v1/auctions/:auctionId/players', playerRoutes);
app.use('/api/auctions/:auctionId/players', playerRoutes);
app.use('/api/v1/auctions/:auctionId/forms', formTemplateRoutes);
app.use('/api/auctions/:auctionId/forms', formTemplateRoutes);
app.use('/api/v1/auctions/:auctionId/submissions', formSubmissionRoutes);
app.use('/api/auctions/:auctionId/submissions', formSubmissionRoutes);
app.use('/api/v1/auctions/:auctionId/sponsors', sponsorRoutes);
app.use('/api/auctions/:auctionId/sponsors', sponsorRoutes);

// Mount Auction Sessions & Live Bidding Engine (/api/v1/auctions/:auctionId/sessions & /session)
app.use('/api/v1/auctions/:auctionId/sessions', sessionRoutes);
app.use('/api/v1/auctions/:auctionId/session', sessionRoutes);
app.use('/api/auctions/:auctionId/sessions', sessionRoutes);
app.use('/api/auctions/:auctionId/session', sessionRoutes);


// In-memory demo auction data for frontend display
interface AuctionItem {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  startingBid: number;
  totalBids: number;
  endsAt: string;
  category: string;
  imageUrl: string;
  status: 'active' | 'ended';
}

const mockAuctions: AuctionItem[] = [
  {
    id: 'auc-1',
    title: 'Vintage Rolex Submariner 1978',
    description: 'Rare vintage timepiece in mint collector condition with original certificate.',
    currentBid: 14500,
    startingBid: 8000,
    totalBids: 24,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    category: 'Watches',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    status: 'active',
  },
  {
    id: 'auc-2',
    title: '1967 Shelby GT500 Fastback',
    description: 'Fully restored 428 Police Interceptor V8, Wimbledon White with Guardsman Blue stripes.',
    currentBid: 185000,
    startingBid: 120000,
    totalBids: 42,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    category: 'Classic Cars',
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80',
    status: 'active',
  },
  {
    id: 'auc-3',
    title: 'Original Oil Painting - Ethereal Dunes',
    description: 'Contemporary impressionist oil on Belgian linen canvas by studio masters.',
    currentBid: 4200,
    startingBid: 2500,
    totalBids: 15,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    category: 'Art',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    status: 'active',
  },
];

app.get('/api/auctions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: mockAuctions.length,
    data: mockAuctions,
  });
});

app.get('/api/auctions/:id', (req: Request, res: Response) => {
  const item = mockAuctions.find((a) => a.id === req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Auction not found' });
    return;
  }
  res.json({ success: true, data: item });
});

app.post('/api/auctions/:id/bid', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  const item = mockAuctions.find((a) => a.id === id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Auction not found' });
    return;
  }

  if (typeof amount !== 'number' || amount <= item.currentBid) {
    res.status(400).json({
      success: false,
      message: `Bid amount must be strictly greater than current bid ($${item.currentBid.toLocaleString()})`,
    });
    return;
  }

  item.currentBid = amount;
  item.totalBids += 1;

  res.json({
    success: true,
    message: 'Bid placed successfully!',
    data: item,
  });
});

const httpServer = http.createServer(app);
initSocket(httpServer, allowedOrigins);

httpServer.listen(PORT, () => {
  console.log(`🚀 Auction Backend & Socket.IO server running on http://localhost:${PORT}`);
});
