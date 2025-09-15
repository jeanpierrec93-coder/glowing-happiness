const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Import the path module

// API Keys
const ALPHA_VANTAGE_API_KEY = '85PCP4ZQKKVBO63P';
const NEWS_API_KEY = '4fef2e54f59e4a42aef34694f1d011bd';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Serve Frontend ---
// This tells Express to serve the built React app from the 'frontend/dist' directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- API Helper Functions (omitted for brevity, they are the same as before) ---
async function getStockPrice(ticker) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  try {
    const response = await axios.get(url);
    const data = response.data['Global Quote'];
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No stock data found. The ticker might be invalid or the API limit reached.');
    }
    return {
      price: parseFloat(data['05. price']),
      changePercent: data['10. change percent']
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error.message);
    throw new Error('Could not fetch stock price.');
  }
}

async function getCompanyNews(ticker) {
  const url = `https://newsapi.org/v2/everything?q=${ticker}&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.articles;
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error.message);
    throw new Error('Could not fetch news.');
  }
}

function analyzeSentiment(articles) {
  let positive_score = 0;
  let negative_score = 0;
  const positive_keywords = ['success', 'gains', 'profit', 'up', 'launch', 'innovative', 'leading', 'strong'];
  const negative_keywords = ['loss', 'down', 'fail', 'risk', 'warns', 'slump', 'investigation', 'volatile'];
  articles.forEach(article => {
    const title = (article.title || '').toLowerCase();
    positive_keywords.forEach(word => {
      if (title.includes(word)) positive_score++;
    });
    negative_keywords.forEach(word => {
      if (title.includes(word)) negative_score++;
    });
  });
  if (positive_score > negative_score) return 'POSITIVE';
  if (negative_score > positive_score) return 'NEGATIVE';
  return 'NEUTRAL';
}

// --- Main API Route ---
app.post('/api/simulate', async (req, res) => {
  const { stockTicker } = req.body;
  if (!stockTicker) {
    return res.status(400).json({ error: 'Stock ticker is required.' });
  }
  console.log(`--- New Simulation for ${stockTicker} ---`);
  try {
    const stockData = await getStockPrice(stockTicker);
    const articles = await getCompanyNews(stockTicker);
    console.log(`Fetched price for ${stockTicker}: $${stockData.price}`);
    console.log(`Fetched ${articles.length} news articles.`);
    const sentiment = analyzeSentiment(articles);
    console.log(`Overall news sentiment: ${sentiment}`);
    let action = 'HOLD';
    let reason = 'Market conditions are neutral.';
    const priceChange = parseFloat(stockData.changePercent.replace('%',''));
    if (sentiment === 'POSITIVE' && priceChange > 0) {
      action = 'BUY';
      reason = `Positive news sentiment and price is up (${priceChange}%). Strong upward momentum.`;
    } else if (sentiment === 'NEGATIVE' && priceChange < -1) {
      action = 'SELL';
      reason = `Negative news sentiment and price is down significantly (${priceChange}%). Potential downturn.`;
    } else if (sentiment === 'POSITIVE' && priceChange < -2) {
        action = 'BUY';
        reason = `Positive news despite a recent price dip (${priceChange}%). Potential buy-the-dip opportunity.`;
    }
    console.log(`Decision: ${action}. Reason: ${reason}`);
    res.json({
      action,
      reason,
      sentiment,
      stockData,
      newsHeadlines: articles.slice(0, 3).map(a => a.title)
    });
  } catch (error) {
    console.error('Simulation failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Catch-all Route ---
// This makes sure that if you refresh the page, the React app handles the routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- Server Activation ---

// Start the server and listen on 0.0.0.0 to accept connections from outside the container
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT}`);
});
