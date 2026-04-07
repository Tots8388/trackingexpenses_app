import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionForm from './pages/TransactionForm';
import Reports from './pages/Reports';
import Budgets from './pages/Budgets';
import BudgetForm from './pages/BudgetForm';
import Recurring from './pages/Recurring';
import RecurringForm from './pages/RecurringForm';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/transactions/add" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
            <Route path="/transactions/:id/edit" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
            <Route path="/budgets/add" element={<ProtectedRoute><BudgetForm /></ProtectedRoute>} />
            <Route path="/budgets/:id/edit" element={<ProtectedRoute><BudgetForm /></ProtectedRoute>} />
            <Route path="/recurring" element={<ProtectedRoute><Recurring /></ProtectedRoute>} />
            <Route path="/recurring/add" element={<ProtectedRoute><RecurringForm /></ProtectedRoute>} />
            <Route path="/recurring/:id/edit" element={<ProtectedRoute><RecurringForm /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
