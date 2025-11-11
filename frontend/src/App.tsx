import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminCategories from './pages/admin/Categories';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import Settings from './pages/admin/Settings';
import UserSettings from './pages/UserSettings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminCategories />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<ProductForm />} />
          <Route path="/admin/products/edit/:id" element={<ProductForm />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/settings" element={<UserSettings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
