const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config');
const passport = require('passport');
const { OpenAI } = require('openai');

const app = express();
const PORT = config.PORT || 3000;

// Connect to Database
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};
connectDB();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com"]
        }
    }
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Define API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));

// Projects routes need to be nested under workspaces
const projectsRouter = require('./routes/projects');
app.use('/api/workspaces/:workspaceId/projects', projectsRouter);

// Chat API endpoint

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, context, step } = req.body;
        
        if (!process.env.OPENAI_API_KEY) {
            // Fallback response if no API key
            const fallbackResponses = [
                "That's a great insight! Let's build on that idea and move forward with your business planning.",
                "I understand your perspective. This will be valuable as we develop your business strategy.",
                "Excellent! Your response shows you're thinking strategically about your business opportunity.",
                "Thank you for sharing that. Let's use this information to strengthen your business foundation."
            ];
            const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            return res.json({ response: randomResponse });
        }
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert business advisor and mentor. Your job is to help entrepreneurs build their business step by step. For each user answer, give specific, actionable feedback, highlight strengths and areas to improve, and suggest concrete next actions. Ask follow-up questions that help clarify their ideas or push them to think deeper. Be interactive, constructive, and encouraging. If possible, reference previous answers or business context. Keep responses concise but valuable (2-4 sentences)."
                },
                {
                    role: "user",
                    content: `${context}\n\nUser's response: ${message}`
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        });
        
        const aiResponse = completion.choices[0]?.message?.content || "Thank you for sharing that. Let's continue building your business together.";
        
        res.json({ response: aiResponse });
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        
        // Fallback response on error
        const fallbackResponse = "I appreciate your input. Let's keep moving forward with your business planning journey.";
        res.json({ response: fallbackResponse });
    }
});


// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Competitor analysis endpoint
app.post('/api/analyze-competitors', async (req, res) => {
    try {
        const { problemStatement } = req.body;
        
        // Simulate competitor analysis (in production, this would use real APIs)
        const competitors = [
            {
                name: "IdeaValidator Pro",
                description: "Validates business ideas through market research",
                strengths: ["Market research", "Validation tools"],
                weaknesses: ["Limited AI guidance", "No end-to-end support"]
            },
            {
                name: "StartupCanvas",
                description: "Lean canvas creation tool",
                strengths: ["Canvas templates", "Collaboration features"],
                weaknesses: ["No AI assistance", "Static templates"]
            },
            {
                name: "PitchDeck.ai",
                description: "AI-powered pitch deck generator",
                strengths: ["AI generation", "Professional templates"],
                weaknesses: ["Only pitch decks", "No business planning"]
            }
        ];
        
        const analysis = {
            competitors,
            gaps: [
                "Limited AI-driven guidance throughout the entire journey",
                "No integrated motivational coaching",
                "Separate tools for different stages",
                "Lack of comprehensive end-to-end solution"
            ],
            opportunities: [
                "Create an all-in-one solution with AI guidance",
                "Integrate motivational support throughout the process",
                "Provide seamless workflow from idea to launch",
                "Offer personalized recommendations based on industry"
            ]
        };
        
        res.json(analysis);
    } catch (error) {
        console.error('Competitor analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze competitors' });
    }
});

// Generate business insights
app.post('/api/generate-insights', async (req, res) => {
    try {
        const { userResponses, currentStep } = req.body;
        
        const insights = generateBusinessInsights(userResponses, currentStep);
        res.json({ insights });
    } catch (error) {
        console.error('Insights generation error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

// Generate financial projections
app.post('/api/generate-financials', async (req, res) => {
    try {
        const { businessModel, targetMarket, pricingStrategy } = req.body;
        
        const projections = generateFinancialProjections(businessModel, targetMarket, pricingStrategy);
        res.json(projections);
    } catch (error) {
        console.error('Financial generation error:', error);
        res.status(500).json({ error: 'Failed to generate financial projections' });
    }
});

// Export business plan as PDF
app.post('/api/export-plan', async (req, res) => {
    try {
        const { businessPlan } = req.body;
        
        // In production, this would generate a proper PDF
        const planData = {
            ...businessPlan,
            generatedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        res.json({ 
            success: true, 
            downloadUrl: '/api/download-plan',
            planData 
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export business plan' });
    }
});

// Generate a PowerPoint pitch deck
// To use: npm install pptxgenjs
const PPTX = require('pptxgenjs');

app.post('/api/generate-pitch-deck', async (req, res) => {
    try {
        const { businessPlan } = req.body;
        const pptx = new PPTX();
        pptx.addSlide().addText('SandBox Pitch Deck', { x:1, y:1, fontSize:32, bold:true });
        pptx.addSlide().addText(`Problem: ${businessPlan.problemStatement || 'Not provided'}`, { x:1, y:1, fontSize:20 });
        pptx.addSlide().addText(`Solution: ${businessPlan.solutionDetails || 'Not provided'}`, { x:1, y:1, fontSize:20 });
        pptx.addSlide().addText(`Target Market: ${businessPlan.customerSegments || 'Not provided'}`, { x:1, y:1, fontSize:20 });
        pptx.addSlide().addText(`Financials: ${businessPlan.financialSummary || 'Not provided'}`, { x:1, y:1, fontSize:20 });
        // Add more slides as needed
        const fileName = 'SandBox_Pitch_Deck.pptx';
        await pptx.write('nodebuffer').then(buffer => {
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
            res.send(buffer);
        });
    } catch (error) {
        console.error('Pitch deck generation error:', error);
        res.status(500).json({ error: 'Failed to generate pitch deck' });
    }
});

// To use: npm install jspdf
const { jsPDF } = require('jspdf');

app.post('/api/generate-financial-report', async (req, res) => {
    try {
        const { projections } = req.body;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('SandBox Financial Report', 20, 20);
        doc.setFontSize(12);
        let y = 40;
        for (const year of Object.keys(projections)) {
            doc.text(`${year.toUpperCase()}:`, 20, y);
            y += 8;
            const data = projections[year];
            doc.text(`Revenue: $${data.revenue}`, 30, y); y += 8;
            doc.text(`Costs: $${data.costs}`, 30, y); y += 8;
            doc.text(`Profit: $${data.profit}`, 30, y); y += 8;
            doc.text(`Customers: ${data.customers}`, 30, y); y += 12;
        }
        const fileName = 'SandBox_Financial_Report.pdf';
        const pdfBuffer = doc.output('arraybuffer');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Financial report generation error:', error);
        res.status(500).json({ error: 'Failed to generate financial report' });
    }
});

// Get motivational quotes
app.get('/api/quotes/:category?', (req, res) => {
    const { category } = req.params;
    
    const quotes = [
        {
            quote: "The way to get started is to quit talking and begin doing.",
            author: "Walt Disney",
            category: "execution"
        },
        {
            quote: "Innovation distinguishes between a leader and a follower.",
            author: "Steve Jobs",
            category: "innovation"
        },
        {
            quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            author: "Winston Churchill",
            category: "persistence"
        },
        {
            quote: "Creativity is intelligence having fun.",
            author: "Albert Einstein",
            category: "creativity"
        },
        {
            quote: "Your most unhappy customers are your greatest source of learning.",
            author: "Bill Gates",
            category: "customer"
        },
        {
            quote: "The best stories are the ones that connect us to something larger than ourselves.",
            author: "Simon Sinek",
            category: "storytelling"
        },
        {
            quote: "By failing to prepare, you are preparing to fail.",
            author: "Benjamin Franklin",
            category: "planning"
        },
        {
            quote: "In God we trust. All others must bring data.",
            author: "W. Edwards Deming",
            category: "data"
        },
        {
            quote: "Ideas are easy. Implementation is hard.",
            author: "Guy Kawasaki",
            category: "execution"
        },
        {
            quote: "Documentation is a love letter that you write to your future self.",
            author: "Damian Conway",
            category: "documentation"
        },
        {
            quote: "Capital is important, but it's not the most important thing. The most important thing is the people.",
            author: "Jack Ma",
            category: "funding"
        }
    ];
    
    const filteredQuotes = category 
        ? quotes.filter(q => q.category === category)
        : quotes;
    
    const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    res.json(randomQuote);
});

// Serve main application
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper functions
function generateBusinessInsights(userResponses, currentStep) {
    const insights = [];
    
    if (userResponses.problemStatement) {
        insights.push("Problem statement defined - foundation set");
    }
    
    if (userResponses.solutionDetails) {
        insights.push("Solution differentiation identified");
    }
    
    if (userResponses.customerSegments) {
        insights.push("Target market mapped");
    }
    
    if (currentStep > 10) {
        insights.push("Business model taking shape");
    }
    
    if (currentStep > 15) {
        insights.push("Ready for investor conversations");
    }
    
    return insights;
}

function generateFinancialProjections(businessModel, targetMarket, pricingStrategy) {
    // Simplified financial projection logic
    const baseRevenue = 10000;
    const growthRate = 1.5;
    
    return {
        year1: {
            revenue: baseRevenue,
            costs: baseRevenue * 0.7,
            profit: baseRevenue * 0.3,
            customers: 100
        },
        year2: {
            revenue: baseRevenue * growthRate * 2,
            costs: baseRevenue * growthRate * 2 * 0.6,
            profit: baseRevenue * growthRate * 2 * 0.4,
            customers: 300
        },
        year3: {
            revenue: baseRevenue * growthRate * 4,
            costs: baseRevenue * growthRate * 4 * 0.5,
            profit: baseRevenue * growthRate * 4 * 0.5,
            customers: 800
        }
    };
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SandBox AI Incubator running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
