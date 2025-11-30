import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';

const router: Router = Router();

// POST /ai/recommendations
router.post('/recommendations', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            res.status(400).json({ error: 'Items array is required' });
            return;
        }
        const recommendations = await aiService.getRecommendations(items);
        res.json(recommendations);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        next(error);
    }
});

// POST /ai/avatar
router.post('/avatar', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username } = req.body;
        if (!username) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }
        const avatarUrl = await aiService.generateAvatar(username);
        res.json({ avatarUrl });
    } catch (error) {
        console.error('Error generating avatar:', error);
        next(error);
    }
});

// POST /ai/vision
router.post('/vision', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { image } = req.body; // Expecting base64 string
        if (!image) {
            res.status(400).json({ error: 'Image data is required' });
            return;
        }
        const title = await aiService.identifyMovieFromImage(image);
        res.json({ analysis: title });
    } catch (error) {
        console.error('Error identifying movie:', error);
        next(error);
    }
});

// POST /ai/chat
router.post('/chat', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { message, context } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        const response = await aiService.chat(message, context || []);
        res.json({ response });
    } catch (error) {
        console.error('Error in chat:', error);
        next(error);
    }
});

// POST /ai/analyze
router.post('/analyze', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, plot, notes } = req.body;
        if (!title || !plot) {
            res.status(400).json({ error: 'Title and plot are required' });
            return;
        }
        const analysis = await aiService.analyzeContext(title, plot, notes || '');
        res.json({ analysis });
    } catch (error) {
        console.error('Error analyzing context:', error);
        next(error);
    }
});

export { router as aiRouter };
