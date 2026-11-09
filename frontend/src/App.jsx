import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

/**
 * Root application component.
 * Responsibilities:
 * - Configure routing provider
 * - Configure global providers (future: theme, auth, query client)
 * - Delegate rendering to AppRoutes
 *
 * Keep this component minimal. Avoid adding business logic here.
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

