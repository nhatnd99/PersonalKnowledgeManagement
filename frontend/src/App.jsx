import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { AuthProvider } from './features/auth/context/AuthContext.jsx';

/**
 * Root application component.
 * Responsibilities:
 * - Configure routing provider
 * - Configure global providers (ErrorBoundary, AuthProvider)
 * - Delegate rendering to AppRoutes
 *
 * Keep this component minimal. Avoid adding business logic here.
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
