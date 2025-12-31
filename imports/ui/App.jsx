import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "/client/styles/global.css";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import LandingPage from "./pages/Landing/LandingPage";
import HowItWorksPage from "./pages/HowItWorks/HowItWorksPage";
import CatalogPage from "./pages/Catalog/CatalogPage";
import PricingPage from "./pages/Pricing/PricingPage";
import GenericPage from "./components/GenericPage";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import Overview from "./pages/Dashboard/Overview";
import ProductCatalog from "./pages/Dashboard/ProductCatalog";
import MyProducts from "./pages/Dashboard/MyProducts";
import Designs from "./pages/Dashboard/Designs";
import Orders from "./pages/Dashboard/Orders";
import Stores from "./pages/Dashboard/Stores";
import Billing from "./pages/Dashboard/Billing";
import Settings from "./pages/Dashboard/Settings";
import AdminProducts from "./pages/Dashboard/AdminProducts";
import AdminUsers from "./pages/Dashboard/AdminUsers";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import ManageOrders from "./pages/Dashboard/ManageOrders";
import ManageProviders from "./pages/Dashboard/ManageProviders";
import { CheckoutSuccessPage, CheckoutCancelPage } from "./pages/Checkout/CheckoutPage";

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route
              path="/print-on-demand"
              element={
                <GenericPage
                  title="Print On Demand"
                  subtitle="The future of e-commerce"
                  content={
                    <p>
                      Learn about print-on-demand business model and how it can
                      help you start selling online without inventory.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/quality"
              element={
                <GenericPage
                  title="Quality Promise"
                  subtitle="Premium products, guaranteed"
                  content={
                    <p>
                      We partner with the best manufacturers to ensure your
                      products meet the highest quality standards.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/what-to-sell"
              element={
                <GenericPage
                  title="What to Sell?"
                  subtitle="Find your niche"
                  content={
                    <p>
                      Discover trending products and find the perfect items to
                      sell in your online store.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/solutions/:type"
              element={
                <GenericPage
                  title="Solutions"
                  subtitle="Tailored for your business"
                  content={
                    <p>
                      Explore our solutions designed specifically for your
                      business needs.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/blog"
              element={
                <GenericPage
                  title="Blog"
                  subtitle="Tips, guides, and inspiration"
                  content={
                    <p>
                      Stay updated with the latest trends, tips, and success
                      stories from the print-on-demand industry.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/guides"
              element={
                <GenericPage
                  title="Guides"
                  subtitle="Step-by-step tutorials"
                  content={
                    <p>
                      Comprehensive guides to help you succeed with your
                      print-on-demand business.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/faq"
              element={
                <GenericPage
                  title="FAQ"
                  subtitle="Frequently asked questions"
                  content={
                    <p>
                      Find answers to common questions about Printify and
                      print-on-demand.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/help"
              element={
                <GenericPage
                  title="Help Center"
                  subtitle="We're here to help"
                  content={
                    <p>
                      Browse our help articles or contact our support team for
                      assistance.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/services/:type"
              element={
                <GenericPage
                  title="Services"
                  subtitle="Premium services for your business"
                  content={
                    <p>
                      Explore our premium services to take your business to the
                      next level.
                    </p>
                  }
                />
              }
            />
            <Route
              path="/support/:type"
              element={
                <GenericPage
                  title="Support"
                  subtitle="Get the help you need"
                  content={
                    <p>
                      Our support team is ready to assist you with any questions
                      or issues.
                    </p>
                  }
                />
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Stripe Checkout Routes */}
            <Route path="/subscription/success" element={<CheckoutSuccessPage />} />
            <Route path="/subscription/cancel" element={<CheckoutCancelPage />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="products" element={<ProductCatalog />} />
              <Route path="my-products" element={<MyProducts />} />
              {/* Product-specific design editor */}
              <Route path="design/:productId" element={<Designs />} />
              <Route path="designs" element={<Designs />} />
              <Route path="orders" element={<Orders />} />
              <Route path="stores" element={<Stores />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/products" element={<AdminProducts />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="manage-orders" element={<ManageOrders />} />
              <Route path="manage-providers" element={<ManageProviders />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
};
