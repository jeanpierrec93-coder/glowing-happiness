
import { useState } from 'react';
import axios from 'axios';

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/simulate', {
        stockTicker: ticker,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response ? err.response.data.error : 'Could not connect to the server.');
    }
    setLoading(false);
  };

  const getResultCardClass = (action) => {
    if (!action) return '';
    return `card result-card ${action.toLowerCase()}`;
  };

  const getResultHeaderClass = (action) => {
    if (!action) return '';
    return `result-header ${action.toLowerCase()}`;
  };

  return (
    <div className="container">
      <h1 className="my-4">Simulador de Trading Inteligente</h1>
      <div className="form-container">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Ej: AAPL, MSFT, GOOGL"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
        />
        <button className="btn btn-primary" onClick={handleSimulate} disabled={loading}>
          {loading ? 'Simulando...' : 'Simular'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {result && (
        <div className={getResultCardClass(result.action)}>
          <div className="card-body">
            <h2 className={getResultHeaderClass(result.action)}>{result.action}</h2>
            <p className="card-text"><strong>Razón:</strong> {result.reason}</p>
            <hr />
            <h5 className="card-title">Datos del Mercado</h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item"><strong>Precio:</strong> ${result.stockData.price}</li>
              <li className="list-group-item"><strong>Cambio:</strong> {result.stockData.changePercent}</li>
              <li className="list-group-item"><strong>Sentimiento de Noticias:</strong> {result.sentiment}</li>
            </ul>
            <hr />
            <h5 className="card-title">Titulares Recientes</h5>
            <ul className="list-group list-group-flush">
              {result.newsHeadlines.map((headline, index) => (
                <li key={index} className="list-group-item">{headline}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
