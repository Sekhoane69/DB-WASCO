import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

export default function App() {
  const [currentRole, setCurrentRole] = useState('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showWelcome, setShowWelcome] = useState(true);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [loginUser, setLoginUser] = useState('WAS-00123');
  const [loginPass, setLoginPass] = useState('password123');

  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({
    account_id: '',
    full_name: '',
    district: 'Maseru',
    address: '',
    phone: '',
    email: '',
    password: '',
    role: 'customer'
  });

  const [user, setUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [rates, setRates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [usage, setUsage] = useState([]);
  const [lastPayment, setLastPayment] = useState(null);
  const [billSummary, setBillSummary] = useState(null);
  const [segments, setSegments] = useState([]);
  const [leaks, setLeaks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leakForm, setLeakForm] = useState({ district: 'Maseru', location: '', severity: 'Minor drip', details: '' });
  const [payForm, setPayForm] = useState({ card: '', expiry: '', name: '', cvv: '', mpesaPhone: '', bankRef: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showBillModal, setShowBillModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [billMonth, setBillMonth] = useState('May 2025');
  const [usageData, setUsageData] = useState({ prev: '', curr: '', month: 'May 2025' });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const fetchBills = async (accountId) => {
    try {
      const res = await fetch(`${API_BASE}/api/bills/${accountId}`);
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  const doLogin = async () => {
    try {
      const res = await fetch(API_BASE + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: loginUser, password: loginPass })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setCurrentRole(data.user.role);
        setIsLoggedIn(true);
        setCurrentView('home');

        // Fetch personal data for EVERYONE (Admins and Managers are also customers)
        fetchBills(data.user.account_id);
        fetchUsage(data.user.account_id);
        fetchLastPayment(data.user.account_id);
        fetchNotifications(data.user.account_id);
        fetchLeaks();

        if (data.user.role === 'customer') {
          setCurrentPage('dashboard');
        } else if (data.user.role === 'admin') {
          setCurrentPage('customers');
          fetchCustomers();
          fetchAllBills();
          fetchRates();
          fetchBillSummary();
        } else if (data.user.role === 'manager') {
          setCurrentPage('analytics');
          fetchAnalytics();
          fetchSegments();
          fetchCustomers();
        }
        fetchLeaks();
      } else {
        showToast(data.message || "Invalid credentials");
      }
    } catch (err) {
      showToast("Server error. Is the backend running?");
    }
  };

  const doRegister = async () => {
    try {
      const res = await fetch(API_BASE + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...regData, admin_id: user?.account_id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Registration successful! Please login.");
        setIsRegistering(false);
        setLoginUser(regData.account_id);
        setLoginPass(regData.password);
      } else {
        showToast(data.message || "Registration failed");
      }
    } catch (err) {
      showToast("Server error during registration");
    }
  };

  const doChangePassword = async () => {
    if (passData.new !== passData.confirm) {
      showToast("New passwords do not match!");
      return;
    }
    try {
      const res = await fetch(API_BASE + "/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: user.account_id, old_password: passData.old, new_password: passData.new })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Password updated successfully!");
        setShowChangePasswordModal(false);
        setPassData({ old: '', new: '', confirm: '' });
      } else {
        showToast(data.message || "Failed to update password");
      }
    } catch (err) {
      showToast("Server error during password update");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(API_BASE + "/api/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllBills = async () => {
    try {
      const res = await fetch(API_BASE + "/api/all-bills");
      const data = await res.json();
      setAllBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch(API_BASE + "/api/rates");
      const data = await res.json();
      setRates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(API_BASE + "/api/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsage = async (accountId) => {
    try {
      const res = await fetch(`${API_BASE}/api/usage/${accountId}`);
      const data = await res.json();
      setUsage(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async (accountId) => {
    console.log("Attempting to fetch notifications for:", accountId);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${accountId}`);
      const data = await res.json();
      console.log("Fetched notifications:", data);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Notification Error:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchBills(user.account_id);
      fetchUsage(user.account_id);
      fetchNotifications(user.account_id);
      fetchLeaks();

      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications(user.account_id);
      }, 30000);

      if (currentRole === 'admin' || currentRole === 'manager') {
        fetchCustomers();
        fetchAllBills();
        fetchRates();
        fetchAnalytics();
      }

      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user, currentRole]);

  const fetchLastPayment = async (accountId) => {
    try {
      const res = await fetch(`${API_BASE}/api/last-payment/${accountId}`);
      const data = await res.json();
      setLastPayment(data);
    } catch (err) { console.error(err); }
  };

  const fetchBillSummary = async () => {
    try {
      const res = await fetch(API_BASE + '/api/bill-summary');
      const data = await res.json();
      setBillSummary(data);
    } catch (err) { console.error(err); }
  };

  const fetchSegments = async () => {
    try {
      const res = await fetch(API_BASE + '/api/segments');
      const data = await res.json();
      setSegments(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchLeaks = async () => {
    try {
      const res = await fetch(API_BASE + '/api/leaks');
      const data = await res.json();
      setLeaks(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const [payAmount, setPayAmount] = useState('');

  const doLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const showPage = (id) => {
    setCurrentPage(id);
    setCurrentView('home');
    if (id === 'payment' && currentBill) {
      setPayAmount(currentBill.amount.toString());
    }
  };

  const setView = (v) => {
    setCurrentView(v);
    if (v !== 'services') {
      setCurrentPage('dashboard');
    } else {
      fetchRates();
    }
  };

  const processPayment = async () => {
    if (!currentBill) return;
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert("Please enter a valid payment amount greater than zero.");
      return;
    }
    try {
      const res = await fetch(API_BASE + '/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: currentBill.bill_id,
          amount: payAmount,
          account_id: user?.account_id,
          payment_method: paymentMethod
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert("Payment Failed: " + (data.error || "Please try again."));
        return;
      }

      const newReceipt = {
        transactionId: 'WREC-' + Math.floor(Math.random() * 1000000),
        amount: payAmount,
        date: new Date().toLocaleString(),
        billId: currentBill.bill_id,
        customerName: user.name,
        accountId: user.account_id,
        month: currentBill.month
      };

      setReceiptData(newReceipt);
      setShowReceiptModal(true);
      showToast(`Payment of M ${payAmount} processed successfully`);

      // Refresh all data
      fetchBills(user.account_id);
      fetchLastPayment(user.account_id);

      if (user) {
        setUser({ ...user, balance: user.balance - parseFloat(payAmount) });
      }
    } catch (err) {
      showToast('Payment error. Please try again.');
    }
  };

  const viewReceipt = (bill) => {
    const receipt = {
      transactionId: 'WREC-' + Math.floor(Math.random() * 1000000) + '-' + bill.bill_id,
      amount: bill.amount,
      date: new Date().toLocaleDateString(),
      billId: bill.bill_id,
      customerName: user.name,
      accountId: user.account_id,
      month: bill.month
    };
    setReceiptData(receipt);
    setShowReceiptModal(true);
  };

  const submitLeak = async () => {
    try {
      const res = await fetch(API_BASE + '/api/leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leakForm, account_id: user?.account_id })
      });
      await res.json();
      showToast('Leakage report submitted successfully!');
      setLeakForm({ district: 'Maseru', location: '', severity: 'Minor drip', details: '' });
      fetchLeaks();
    } catch (err) {
      showToast('Error submitting report.');
    }
  };

  const updateLeakStatus = async (leakId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/leaks/${leakId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast('Status updated successfully');
        fetchLeaks();
      }
    } catch (err) {
      showToast('Error updating status');
    }
  };

  const updateUserRole = async (accountId, newRole) => {
    if (!user || !user.account_id) {
      showToast('Error: Admin not logged in correctly');
      return;
    }
    console.log(`Changing role for ${accountId} to ${newRole} (Admin: ${user.account_id})`);
    try {
      const res = await fetch(`${API_BASE}/api/user/set-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, role: newRole, admin_id: user.account_id })
      });

      if (!res.ok) {
        let errMsg = `Server error: ${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData.message) errMsg = errData.message;
        } catch (e) {
          // Not JSON, stay with default
        }
        showToast(errMsg);
        return;
      }

      const data = await res.json();
      showToast(`Role updated to ${newRole.toUpperCase()}`);
      fetchCustomers();
      // Update selected customer locally too
      if (selectedCustomer && selectedCustomer.account_id === accountId) {
        setSelectedCustomer({ ...selectedCustomer, role: newRole });
      }
    } catch (err) {
      console.error('Role update fetch error:', err);
      showToast('Network error: ' + err.message);
    }
  };

  const triggerGenerateBill = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(API_BASE + '/api/generate-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedCustomer.account_id,
          month: billMonth,
          admin_id: user.account_id
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Bill generated for ${selectedCustomer.full_name}`);
        setShowBillModal(false);
        fetchAllBills();
        fetchCustomers();
        // Refresh customer's own bills so payment page sees the new bill
        if (user?.account_id) fetchBills(user.account_id);
      } else {
        showToast(`Error: ${data.message || "Failed to generate bill"}`);
      }
    } catch (err) {
      showToast(`Error: ${err.message || 'Connection failed'}`);
    }
  };

  const submitUsage = async () => {
    if (!selectedCustomer) return;
    try {
      // 1. Save Usage
      const res = await fetch(API_BASE + '/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedCustomer.account_id,
          month: usageData.month,
          meter_reading_previous: usageData.prev,
          meter_reading_current: usageData.curr
        })
      });
      const data = await res.json();

      if (res.ok) {
        // 2. Automatically trigger Bill Generation
        const billRes = await fetch(API_BASE + '/api/generate-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: selectedCustomer.account_id,
            month: usageData.month,
            admin_id: user.account_id
          })
        });
        const billData = await billRes.json();

        showToast(`Usage saved! New Bill: M ${billData.amount || 'Calculated'}. Total Balance updated.`);
        setShowUsageModal(false);
        setUsageData({ prev: '', curr: '', month: 'May 2025' });

        // 3. Refresh Data
        fetchCustomers();
        fetchAllBills();
        // Refresh customer's own bills so payment page sees the new bill
        if (user?.account_id) fetchBills(user.account_id);
      } else {
        showToast(`Error: ${data.message || "Failed to save usage"}`);
      }
    } catch (err) {
      showToast(`Error: ${err.message || 'Connection failed'}`);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); }, 2800);
  };

  let welcomeTitle = user ? `Welcome back, ${user.name}` : 'Welcome back';
  if (currentRole === 'admin') welcomeTitle = 'Admin Dashboard';
  else if (currentRole === 'manager') welcomeTitle = 'Branch Manager Dashboard';

  const roleBadge = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  // Robust current bill logic: find the latest unpaid bill
  const sortedBills = [...bills].sort((a, b) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [ma, ya] = a.month.split(' ');
    const [mb, yb] = b.month.split(' ');
    if (ya !== yb) return parseInt(yb) - parseInt(ya);
    return months.indexOf(mb) - months.indexOf(ma);
  });

  const currentBill = sortedBills.find(b => b.status === 'Pending' || b.status === 'Overdue') || sortedBills[0] || null;
  const totalOutstanding = bills.filter(b => b.status !== 'Paid').reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

  const allBillsStats = billSummary || {};
  const safeAllBills = Array.isArray(allBills) ? allBills : [];
  const totalBills = safeAllBills.length;
  const paidCount = safeAllBills.filter(b => b.status === 'Paid').length;
  const pendingCount = safeAllBills.filter(b => b.status === 'Pending').length;
  const overdueCount = safeAllBills.filter(b => b.status === 'Overdue').length;
  const billBreakdown = totalBills > 0 ? [
    { status: 'Paid', pct: Math.round((paidCount / totalBills) * 100), color: '#0F6E56' },
    { status: 'Pending', pct: Math.round((pendingCount / totalBills) * 100), color: '#EF9F27' },
    { status: 'Overdue', pct: Math.round((overdueCount / totalBills) * 100), color: '#E24B4A' },
  ] : [];

  const quarterlyRevenue = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      label: `${q} 25`,
      val: Math.round(safeAllBills.filter(b => {
        const [monthName] = b.month.split(' ');
        const m = monthNames.indexOf(monthName);
        return m >= i * 3 && m < (i + 1) * 3;
      }).reduce((s, b) => s + parseFloat(b.amount || 0), 0))
    };
  });

  return (
    <>
      <div id="toast" style={{ opacity: toastVisible ? 1 : 0 }}>{toastMsg}</div>

      {showWelcome && (
        <div className="welcome-screen">
          <div className="welcome-nav">
            <div className="welcome-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--primary-color)">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
              <span>WASCO</span>
            </div>
            <button className="btn btn-outline" onClick={() => setShowWelcome(false)}>Login</button>
          </div>

          <div className="welcome-hero">
            <div className="hero-content">
              <h1>Water Management <br /><span>Made Simple.</span></h1>
              <p>Access your bills, track your water usage, and report issues instantly with the official WASCO Customer Portal.</p>
              <div className="hero-actions">
                <button className="btn btn-primary btn-hero-lg" onClick={() => setShowWelcome(false)}>Get Started</button>
                <button className="btn btn-outline btn-hero-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>Learn More</button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-card">
                <div className="card-dot"></div>
                <div className="card-line" style={{ width: '60%' }}></div>
                <div className="card-line" style={{ width: '40%' }}></div>
                <div className="card-amount">M 225.00</div>
              </div>
              <div className="visual-circle"></div>
            </div>
          </div>

          <div className="welcome-features" id="features">
            <div className="feature-card">
              <div className="f-icon">💳</div>
              <h3>Quick Payments</h3>
              <p>Pay your bills securely using M-Pesa, EcoCash, or Card.</p>
            </div>
            <div className="feature-card">
              <div className="f-icon">📊</div>
              <h3>Usage Tracking</h3>
              <p>Monitor your water consumption with real-time analytics.</p>
            </div>
            <div className="feature-card">
              <div className="f-icon">🚨</div>
              <h3>Report Leaks</h3>
              <p>Help us save water by reporting leakages in your area.</p>
            </div>
          </div>

          <div className="welcome-services-section" style={{ padding: '0 8% 80px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '36px', fontFamily: "'Outfit', sans-serif", color: '#0f172a', fontWeight: '800' }}>Our Services</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
              <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '32px', padding: '40px', transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', display: 'inline-block', padding: '16px', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '20px' }}>💧</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', color: '#0f172a', marginBottom: '16px', fontWeight: '700' }}>Water Supply</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Domestic and commercial water supply across all 10 districts of Lesotho with tiered, affordable pricing.</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '32px', padding: '40px', transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', display: 'inline-block', padding: '16px', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '20px' }}>🚽</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', color: '#0f172a', marginBottom: '16px', fontWeight: '700' }}>Sewerage Services</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Wastewater collection and treatment services in urban areas, ensuring environmental protection.</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '32px', padding: '40px', transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', display: 'inline-block', padding: '16px', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '20px' }}>🔌</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', color: '#0f172a', marginBottom: '16px', fontWeight: '700' }}>New Connections</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Apply online for new water or sewerage connections. Processing takes 5-10 business days.</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '32px', padding: '40px', transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: '32px', marginBottom: '20px', display: 'inline-block', padding: '16px', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '20px' }}>📞</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', color: '#0f172a', marginBottom: '16px', fontWeight: '700' }}>Customer Support</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Contact our team at 22312449 or visit your nearest district office for any enquiries.</p>
              </div>
            </div>
          </div>

          <div className="welcome-footer">
            <p>© 2026 Water and Sewerage Company of Lesotho. All rights reserved.</p>
          </div>
        </div>
      )}

      {showBillModal && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="panel-head"><div className="panel-title">Generate Bill</div></div>
            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
              Generating a bill for <strong>{selectedCustomer?.full_name}</strong> ({selectedCustomer?.account_id}).
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Billing Month</label>
              <select value={billMonth} onChange={e => setBillMonth(e.target.value)}>
                <option>January 2025</option><option>February 2025</option><option>March 2025</option>
                <option>April 2025</option><option>May 2025</option><option>June 2025</option>
                <option>July 2025</option><option>August 2025</option><option>September 2025</option>
                <option>October 2025</option><option>November 2025</option><option>December 2025</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={triggerGenerateBill}>Generate</button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowBillModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showUsageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '16px' }}>Add Water Usage</h3>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '20px' }}>
              Enter meter readings for <strong>{selectedCustomer?.full_name}</strong>
            </p>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Billing Month</label>
              <select value={usageData.month} onChange={(e) => setUsageData({ ...usageData, month: e.target.value })}>
                {['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-row" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Previous Reading (m³)</label>
                <input type="number" placeholder="0.00" value={usageData.prev} onChange={(e) => setUsageData({ ...usageData, prev: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Current Reading (m³)</label>
                <input type="number" placeholder="0.00" value={usageData.curr} onChange={(e) => setUsageData({ ...usageData, curr: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitUsage}>Save Usage</button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowUsageModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button className="modal-close" onClick={() => setShowAddCustomerModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Account ID</label>
                <input type="text" placeholder="WAS-XXXXX" value={regData.account_id} onChange={(e) => setRegData({ ...regData, account_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Full Name" value={regData.full_name} onChange={(e) => setRegData({ ...regData, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Initial Password</label>
                <input type="password" placeholder="Password" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Assign Role</label>
                <select value={regData.role} onChange={(e) => setRegData({ ...regData, role: e.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>District</label>
                  <select value={regData.district} onChange={(e) => setRegData({ ...regData, district: e.target.value })}>
                    <option>Maseru</option><option>Leribe</option><option>Berea</option><option>Mafeteng</option>
                    <option>Mohale's Hoek</option><option>Quthing</option><option>Qacha's Nek</option>
                    <option>Mokhotlong</option><option>Thaba-Tseka</option><option>Butha-Buthe</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" placeholder="Phone" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Email" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" placeholder="Address" value={regData.address} onChange={(e) => setRegData({ ...regData, address: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => { await doRegister(); fetchCustomers(); setShowAddCustomerModal(false); }}>Create Account</button>
              <button className="btn btn-outline" onClick={() => setShowAddCustomerModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={() => setShowChangePasswordModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passData.old} onChange={(e) => setPassData({ ...passData, old: e.target.value })} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passData.new} onChange={(e) => setPassData({ ...passData, new: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passData.confirm} onChange={(e) => setPassData({ ...passData, confirm: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={doChangePassword}>Update Password</button>
              <button className="btn btn-outline" onClick={() => setShowChangePasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && receiptData && (
        <div className="modal-overlay">
          <div className="modal-content receipt-modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="receipt-header">
              <div className="receipt-icon">✅</div>
              <h3>Payment Receipt</h3>
              <p>Thank you for your payment!</p>
            </div>

            <div className="receipt-body" style={{ background: 'var(--gray-50)', padding: '20px', borderRadius: '12px', margin: '20px 0', textAlign: 'left' }}>
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Transaction ID:</span>
                <span style={{ fontWeight: '600' }}>{receiptData.transactionId}</span>
              </div>
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Date:</span>
                <span>{receiptData.date}</span>
              </div>
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Account ID:</span>
                <span>{receiptData.accountId}</span>
              </div>
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Bill Month:</span>
                <span>{receiptData.month}</span>
              </div>
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Customer:</span>
                <span>{receiptData.customerName}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--gray-300)', margin: '15px 0' }}></div>
              <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                <span>Amount Paid:</span>
                <span style={{ color: 'var(--primary-color)' }}>M {receiptData.amount !== undefined ? parseFloat(receiptData.amount).toFixed(2) : '0.00'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setShowReceiptModal(false); showPage('bills'); }}>Done</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <div className="app" id="loginView">
          <div className="login-wrap">
            <div className="login-card">
              <button
                onClick={() => setShowWelcome(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                ← Back to Home
              </button>
              <div className="login-logo">
                <div className="login-logo-mark">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div className="login-title">WASCO Portal</div>
                <div className="login-sub">Water and Sewerage Company of Lesotho</div>
              </div>
              <div className="role-tabs">
                <button className={`role-tab ${!isRegistering ? 'active' : ''}`} onClick={() => setIsRegistering(false)}>Sign In</button>
                <button className={`role-tab ${isRegistering ? 'active' : ''}`} onClick={() => setIsRegistering(true)}>Create Account</button>
              </div>

              {!isRegistering ? (
                <>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Account ID / Username</label>
                    <input type="text" placeholder="e.g., WAS-00123" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" placeholder="Enter your password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                  </div>
                  <div className="login-actions">
                    <button className="btn btn-primary" onClick={doLogin}>Access Account</button>
                  </div>
                  <div className="login-footer">
                    <p>Demo credentials: WAS-00123 / password123</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label>Account ID</label>
                    <input type="text" placeholder="WAS-XXXXX" value={regData.account_id} onChange={(e) => setRegData({ ...regData, account_id: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label>Full Name</label>
                    <input type="text" placeholder="Full Name" value={regData.full_name} onChange={(e) => setRegData({ ...regData, full_name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label>Password</label>
                    <input type="password" placeholder="Create password" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>District</label>
                      <select value={regData.district} onChange={(e) => setRegData({ ...regData, district: e.target.value })}>
                        <option>Maseru</option><option>Leribe</option><option>Berea</option><option>Mafeteng</option>
                        <option>Mohale's Hoek</option><option>Quthing</option><option>Qacha's Nek</option>
                        <option>Mokhotlong</option><option>Thaba-Tseka</option><option>Butha-Buthe</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Phone</label>
                      <input type="text" placeholder="Phone number" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label>Email</label>
                    <input type="email" placeholder="Email address" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Address</label>
                    <input type="text" placeholder="Physical address" value={regData.address} onChange={(e) => setRegData({ ...regData, address: e.target.value })} />
                  </div>
                  <div className="login-actions">
                    <button className="btn btn-primary" onClick={doRegister}>Register Account</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoggedIn && !showWelcome && (
        <div className="app">
          <div className="topbar">
            <div className="topbar-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
              <span>WASCO Water Billing System</span>
              <span className="role-badge">{roleBadge}</span>
            </div>
            <div className="topbar-nav">
              <button className={`tn ${currentView === 'services' ? 'active' : ''}`} onClick={() => setView('services')}>Services</button>
              <button className={`tn ${currentView === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Dashboard</button>
              <button className="tn tn-logout" onClick={doLogout}>Sign Out</button>
            </div>
          </div>
          <div className="main">
            <div className="sidebar">
              <div className="sidebar-section">
                <div className="sidebar-label">Main Menu</div>
                <button className={`slink ${currentPage === 'dashboard' && currentView === 'home' ? 'active' : ''}`} onClick={() => showPage('dashboard')}>
                  <span className="ico">📊</span>Dashboard
                </button>
                <button className={`slink ${currentPage === 'profile' && currentView === 'home' ? 'active' : ''}`} onClick={() => showPage('profile')}>
                  <span className="ico">👤</span>My Profile
                </button>
                <button className={`slink ${currentPage === 'bills' && currentView === 'home' ? 'active' : ''}`} onClick={() => showPage('bills')}>
                  <span className="ico">🧾</span>My Bills
                </button>
                <button className={`slink ${currentPage === 'usage' && currentView === 'home' ? 'active' : ''}`} onClick={() => showPage('usage')}>
                  <span className="ico">🚰</span>Usage History
                </button>
                <button className={`slink ${currentPage === 'leakage' && currentView === 'home' ? 'active' : ''}`} onClick={() => showPage('leakage')}>
                  <span className="ico">⚠️</span>Report Leak
                </button>
                <button className={`slink ${currentPage === 'activity' && currentView === 'home' ? 'active' : ''}`} onClick={() => showPage('activity')}>
                  <span className="ico">📋</span>Activity Log
                </button>
              </div>

              {(currentRole === 'admin' || currentRole === 'manager') && (
                <div className="sidebar-section">
                  <div className="sidebar-label">Management</div>
                  <button className={`slink ${currentPage === 'customers' ? 'active' : ''}`} onClick={() => showPage('customers')}>
                    <span className="ico">👥</span>Customers
                  </button>
                  {currentRole === 'admin' && (
                    <button className={`slink ${currentPage === 'rates' ? 'active' : ''}`} onClick={() => showPage('rates')}>
                      <span className="ico">📋</span>Rate Settings
                    </button>
                  )}
                  {currentRole === 'admin' && (
                    <button className={`slink ${currentPage === 'allbills' ? 'active' : ''}`} onClick={() => showPage('allbills')}>
                      <span className="ico">📑</span>All Bills
                    </button>
                  )}
                  {currentRole === 'manager' && (
                    <button className={`slink ${currentPage === 'analytics' ? 'active' : ''}`} onClick={() => showPage('analytics')}>
                      <span className="ico">📈</span>Analytics
                    </button>
                  )}
                  {currentRole === 'manager' && (
                    <button className={`slink ${currentPage === 'districts' ? 'active' : ''}`} onClick={() => showPage('districts')}>
                      <span className="ico">🗺️</span>Districts
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="content">
              {currentPage === 'dashboard' && currentView !== 'services' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">{welcomeTitle}</h1>
                    <p className="page-sub">{user?.account_id} · {user?.district} · {user?.address || 'Maseru, Lesotho'}</p>
                  </div>

                  {currentPage === 'dashboard' && (
                    <>
                      {currentBill ? (
                        <div className="bill-hero">
                          <div className="bill-hero-icon">💧</div>
                          <div className="bill-hero-content">
                            <div className="bill-hero-label">Statement Balance for {currentBill.month}</div>
                            <div className="bill-hero-amount">M {currentBill.amount?.toLocaleString()}</div>
                            <div className="bill-hero-meta">
                              <span>📊 Usage: {currentBill.usage_m3} m³</span>
                              <span>📅 Due: End of {currentBill.month}</span>
                            </div>
                            <div className="bill-hero-footer" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                              <span style={{ opacity: 0.8, fontSize: '12px' }}>Total Outstanding Balance: </span>
                              <strong style={{ fontSize: '18px' }}>M {totalOutstanding?.toLocaleString()}</strong>
                            </div>
                          </div>
                          <button className="btn btn-hero" onClick={() => showPage('payment')}>Pay Now</button>
                        </div>
                      ) : (
                        <div className="bill-hero bill-hero-empty">
                          <div className="bill-hero-icon">✅</div>
                          <div className="bill-hero-content">
                            <div className="bill-hero-label">No Outstanding Bills</div>
                            <div className="bill-hero-amount">M 0.00</div>
                            <div className="bill-hero-meta">Your account is up to date</div>
                          </div>
                        </div>
                      )}

                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-icon">💰</div>
                          <div className="stat-content">
                            <div className="stat-label">Total Outstanding Balance</div>
                            <div className="stat-value">M {totalOutstanding?.toLocaleString() || '0.00'}</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">💧</div>
                          <div className="stat-content">
                            <div className="stat-label">Average Usage</div>
                            <div className="stat-value">{usage.length > 0 ? (usage.reduce((s, u) => s + parseFloat(u.consumption_m3 || 0), 0) / usage.length).toFixed(1) : '—'} m³</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">💳</div>
                          <div className="stat-content">
                            <div className="stat-label">Last Payment</div>
                            <div className="stat-value">{lastPayment ? `M ${lastPayment.amount?.toLocaleString()}` : '—'}</div>
                            <div className="stat-trend">{lastPayment ? lastPayment.month : 'No payments'}</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">🏠</div>
                          <div className="stat-content">
                            <div className="stat-label">Account Status</div>
                            <div className="stat-value">{user?.status || 'Active'}</div>
                            <div className="stat-trend">Customer since {new Date(user?.created_at || Date.now()).getFullYear()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="content-grid">
                        <div className="panel">
                          <div className="panel-head">
                            <h3 className="panel-title">Recent Notifications</h3>
                            <span className="panel-badge">3 new</span>
                          </div>
                          <div className="notification-list">
                            {notifications.length > 0 ? notifications.slice(0, 3).map((n, idx) => (
                              <div className="notification-item" key={idx}>
                                <div className={`notification-dot ${n.type || 'info'}`}></div>
                                <div className="notification-content">
                                  <div className="notification-text">
                                    {n.type === 'leak' && '🚨 '}
                                    {n.type === 'payment' && '💰 '}
                                    {n.type === 'bill' && '📄 '}
                                    {n.message}
                                  </div>
                                  <div className="notification-time">{new Date(n.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            )) : (
                              <div className="empty-state">No new notifications</div>
                            )}
                          </div>
                        </div>

                        <div className="panel">
                          <div className="panel-head">
                            <h3 className="panel-title">Current Month Usage</h3>
                            <span className="panel-value">{usage[0]?.consumption_m3 || '0'} m³</span>
                          </div>
                          <div className="usage-meter">
                            <div className="usage-track">
                              <div className="usage-fill" style={{ width: `${Math.min(100, ((usage[0]?.consumption_m3 || 0) / 30) * 100)}%` }}></div>
                            </div>
                            <div className="usage-labels">
                              <span>0 m³</span>
                              <span>Tier 1 (0-10)</span>
                              <span>Tier 2 (10-30)</span>
                              <span>30+ m³</span>
                            </div>
                          </div>
                          <div className="rate-preview">
                            {rates.slice(0, 3).map((r, i) => (
                              <div className="rate-row" key={i}>
                                <span>Tier {i + 1}: {r.usage_from}–{r.usage_to} m³</span>
                                <span className="rate-badge">M {r.rate_per_m3}/m³</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="action-buttons">
                        {currentBill && currentBill.status === 'Pending' && (
                          <button className="btn btn-primary btn-large" onClick={() => showPage('payment')}>
                            💳 Pay Bill — M {currentBill.amount?.toLocaleString()}
                          </button>
                        )}
                        <button className="btn btn-secondary btn-large" onClick={() => showPage('bills')}>
                          📄 View Bill History
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {currentPage === 'bills' && currentView !== 'services' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">Billing History</h1>
                    <p className="page-sub">View all your past and current bills</p>
                  </div>

                  <div className="panel">
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Bill ID</th>
                            <th>Period</th>
                            <th>Usage</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBills.map((bill, idx) => (
                            <tr key={idx} className={bill.bill_id === currentBill?.bill_id ? 'current-bill-row' : ''}>
                              <td className="bill-id">
                                {bill.bill_id}
                                {bill.bill_id === currentBill?.bill_id && <span className="current-tag">Current</span>}
                              </td>
                              <td>{bill.month}</td>
                              <td>{bill.usage_m3} m³</td>
                              <td className="amount">M {bill.amount?.toLocaleString()}</td>
                              <td><span className={`status-badge ${bill.status === 'Paid' ? 'paid' : 'pending'}`}>{bill.status}</span></td>
                              <td>
                                {bill.status === 'Paid' ?
                                  <button className="btn btn-sm btn-outline" onClick={() => viewReceipt(bill)}>📄 Receipt</button> :
                                  <button className="btn btn-sm btn-primary" onClick={() => showPage('payment')}>Pay Now</button>
                                }
                              </td>
                            </tr>
                          ))}
                          {bills.length === 0 && (
                            <tr><td colSpan="6" className="empty-table">No bills found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'usage' && currentView !== 'services' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">Water Usage Analytics</h1>
                    <p className="page-sub">Track your monthly water consumption</p>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">📊</div>
                      <div className="stat-content">
                        <div className="stat-label">This Month</div>
                        <div className="stat-value">{usage[0]?.consumption_m3 || '—'} m³</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📉</div>
                      <div className="stat-content">
                        <div className="stat-label">Last Month</div>
                        <div className="stat-value">{usage[1]?.consumption_m3 || '—'} m³</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📈</div>
                      <div className="stat-content">
                        <div className="stat-label">6-Month Avg</div>
                        <div className="stat-value">{usage.length > 0 ? (usage.reduce((s, u) => s + parseFloat(u.consumption_m3 || 0), 0) / usage.length).toFixed(1) : '—'} m³</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">🎯</div>
                      <div className="stat-content">
                        <div className="stat-label">YTD Total</div>
                        <div className="stat-value">{usage.reduce((s, u) => s + parseFloat(u.consumption_m3 || 0), 0).toFixed(1)} m³</div>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">Monthly Consumption Chart</h3>
                    </div>
                    <div className="chart-container">
                      {usage.slice().reverse().map((u, idx) => {
                        const max = Math.max(...usage.map(x => parseFloat(x.consumption_m3 || 0)), 1);
                        const pct = Math.round((parseFloat(u.consumption_m3 || 0) / max) * 100);
                        return (
                          <div className="chart-row" key={idx}>
                            <span className="chart-label">{u.month?.substring(0, 3)}</span>
                            <div className="chart-bar">
                              <div className="chart-fill" style={{ width: `${pct}%`, background: idx === usage.length - 1 ? '#EF9F27' : '#185FA5' }}>
                                <span className="chart-value">{u.consumption_m3} m³</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {usage.length === 0 && <div className="empty-state">No usage data available</div>}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">Meter Readings</h3>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr><th>Month</th><th>Previous Reading</th><th>Current Reading</th><th>Consumption</th></tr>
                        </thead>
                        <tbody>
                          {usage.map((u, idx) => (
                            <tr key={idx}>
                              <td>{u.month}</td>
                              <td>{u.meter_reading_previous} m³</td>
                              <td>{u.meter_reading_current} m³</td>
                              <td className="highlight">{u.consumption_m3} m³</td>
                            </tr>
                          ))}
                          {usage.length === 0 && <tr><td colSpan="4" className="empty-table">No readings found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'payment' && currentView !== 'services' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">Secure Payment Portal</h1>
                    <p className="page-sub">Make a payment for your water bills</p>
                  </div>

                  <div className="payment-grid">
                    <div className="panel payment-summary">
                      <div className="panel-head">
                        <h3 className="panel-title">Bill Summary</h3>
                      </div>
                      <div className="summary-details">
                        <div className="summary-row">
                          <span>Account Number</span>
                          <strong>{user?.account_id}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Billing Period</span>
                          <strong>{currentBill?.month || '—'}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Water Usage</span>
                          <strong>{currentBill?.usage_m3 || '—'} m³</strong>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                          <span>Total Amount Due</span>
                          <strong className="total-amount">M {currentBill?.amount?.toLocaleString() || '0.00'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="panel payment-form-panel">
                      <div className="panel-head">
                        <h3 className="panel-title">Payment Method</h3>
                      </div>
                      <div className="form-group">
                        <label>Select Payment Method</label>
                        <select className="payment-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="card">💳 Credit / Debit Card</option>
                          <option value="mpesa">📱 Mobile Money (M-PESA)</option>
                          <option value="bank">🏦 Bank Transfer</option>
                          <option value="wallet">💰 WASCO Wallet</option>
                        </select>
                      </div>

                      {paymentMethod === 'card' && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Card Number</label>
                              <input type="text" placeholder="1234 5678 9012 3456" value={payForm.card} onChange={e => setPayForm({ ...payForm, card: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Expiry Date</label>
                              <input type="text" placeholder="MM/YY" value={payForm.expiry} onChange={e => setPayForm({ ...payForm, expiry: e.target.value })} />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Cardholder Name</label>
                              <input type="text" placeholder="Name on card" value={payForm.name} onChange={e => setPayForm({ ...payForm, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>CVV</label>
                              <input type="text" placeholder="123" value={payForm.cvv} onChange={e => setPayForm({ ...payForm, cvv: e.target.value })} />
                            </div>
                          </div>
                        </>
                      )}

                      {paymentMethod === 'mpesa' && (
                        <div className="form-group">
                          <label>M-PESA Phone Number</label>
                          <input type="text" placeholder="e.g., +266 5..." value={payForm.mpesaPhone} onChange={e => setPayForm({ ...payForm, mpesaPhone: e.target.value })} />
                          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px' }}>
                            A payment prompt will be sent to this mobile number to enter your PIN.
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'bank' && (
                        <div className="form-group">
                          <label>Bank Transfer Reference</label>
                          <div style={{ padding: '12px', background: 'var(--gray-100)', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', color: 'var(--text-color)', border: '1px solid var(--gray-200)' }}>
                            Please transfer funds to:<br/>
                            <strong>Standard Lesotho Bank</strong><br/>
                            Account: <strong>90123456789</strong><br/>
                            Branch Code: <strong>000000</strong><br/>
                            Payment Reference: <strong style={{ color: 'var(--primary-color)' }}>{currentBill?.bill_id || user?.account_id}</strong>
                          </div>
                          <input type="text" placeholder="Upload Proof of Payment Reference Number" value={payForm.bankRef} onChange={e => setPayForm({ ...payForm, bankRef: e.target.value })} />
                        </div>
                      )}

                      {paymentMethod === 'wallet' && (
                        <div className="form-group">
                          <label>WASCO Wallet Balance</label>
                          <div style={{ padding: '12px', background: 'var(--gray-100)', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', color: 'var(--text-color)', border: '1px solid var(--gray-200)' }}>
                            Available Balance: <strong>M 0.00</strong>
                          </div>
                          <p style={{ fontSize: '12px', color: 'red', marginTop: '4px' }}>
                            Insufficient wallet balance for this transaction. Please select another payment method.
                          </p>
                        </div>
                      )}

                      <div className="form-group">
                        <label>Amount to Pay (M)</label>
                        <input
                          type="number"
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="payment-amount-input"
                        />
                        <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                          Default: Full balance of M {currentBill?.amount?.toLocaleString()}
                        </p>
                      </div>
                      <button className="btn btn-primary btn-pay" onClick={processPayment}>
                        💳 Confirm & Pay M {parseFloat(payAmount || 0).toLocaleString()}
                      </button>
                      <div className="secure-note">
                        🔒 Your payment is secured with 256-bit encryption
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'leakage' && currentView !== 'services' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">Report Water Leakage</h1>
                    <p className="page-sub">Help us identify and fix leaks in your area</p>
                  </div>

                  <div className="leakage-grid">
                    <div className="panel">
                      <div className="panel-head">
                        <h3 className="panel-title">Submit Report</h3>
                      </div>
                      <div className="form-group">
                        <label>📍 District</label>
                        <select value={leakForm.district} onChange={e => setLeakForm({ ...leakForm, district: e.target.value })}>
                          {['Maseru', 'Leribe', 'Berea', 'Butha-Buthe', 'Thaba-Tseka', 'Mokhotlong', "Qacha's Nek", 'Quthing', "Mohale's Hoek", 'Mafeteng'].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>📍 Street / Area</label>
                        <input type="text" placeholder="e.g., Kingsway near the mall" value={leakForm.location} onChange={e => setLeakForm({ ...leakForm, location: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>⚠️ Severity Level</label>
                        <select value={leakForm.severity} onChange={e => setLeakForm({ ...leakForm, severity: e.target.value })}>
                          <option>Minor drip</option>
                          <option>Moderate leak</option>
                          <option>Major burst</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>📝 Additional Details</label>
                        <textarea rows="3" placeholder="Describe the issue..." value={leakForm.details} onChange={e => setLeakForm({ ...leakForm, details: e.target.value })}></textarea>
                      </div>
                      <button className="btn btn-primary btn-submit" onClick={submitLeak}>
                        🚨 Submit Report
                      </button>
                    </div>

                    <div className="panel">
                      <div className="panel-head">
                        <h3 className="panel-title">Recent Reports</h3>
                      </div>
                      <div className="reports-list">
                        {(currentRole === 'customer'
                          ? leaks.filter(l => l.account_id?.toLowerCase() === user?.account_id?.toLowerCase())
                          : leaks).map((lk, idx) => (
                            <div className="report-card" key={idx}>
                              <div className="report-icon">💧</div>
                              <div className="report-details">
                                <div className="report-location">{lk.location}</div>
                                <div className="report-meta">{lk.severity} · {lk.district}</div>
                                <div className="report-date">Reported: {lk.created_at ? new Date(lk.created_at).toLocaleDateString() : 'N/A'}</div>
                              </div>
                              {(currentRole === 'admin' || currentRole === 'manager') ? (
                                <select value={lk.status || 'Open'} onChange={(e) => updateLeakStatus(lk.id, e.target.value)} className="status-select">
                                  <option>Open</option>
                                  <option>Investigating</option>
                                  <option>Fixed</option>
                                  <option>Closed</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${lk.status === 'Open' ? 'pending' : lk.status === 'Investigating' ? 'warning' : 'paid'}`}>
                                  {lk.status || 'Open'}
                                </span>
                              )}
                            </div>
                          ))}
                        {leaks.length === 0 && <div className="empty-state">No reports found</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'profile' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-sub">Manage your personal contact information and account security</p>
                  </div>

                  <div className="profile-card">
                    <div className="profile-avatar-section">
                      <div className="profile-avatar-placeholder">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="profile-avatar-info">
                        <h3>{user?.name}</h3>
                        <p>Account: {user?.account_id}</p>
                      </div>
                    </div>

                    <div className="profile-info-grid">
                      <form className="profile-form" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const res = await fetch(API_BASE + '/api/user/update', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            account_id: user.account_id,
                            phone: formData.get('phone'),
                            email: formData.get('email'),
                            address: formData.get('address')
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          showToast("Profile updated successfully!");
                          const userRes = await fetch(`${API_BASE}/api/user/${user.account_id}`);
                          const userData = await userRes.json();
                          setUser(userData);
                        }
                      }}>
                        <div className="form-group">
                          <label>Full Name</label>
                          <input type="text" value={user?.name} disabled className="input-disabled" />
                        </div>
                        <div className="form-group">
                          <label>District</label>
                          <input type="text" value={user?.district} disabled className="input-disabled" />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input type="text" name="phone" defaultValue={user?.phone} placeholder="+266 5..." />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input type="email" name="email" defaultValue={user?.email} placeholder="name@example.com" />
                        </div>
                        <div className="form-group full-width">
                          <label>Residential Address</label>
                          <textarea name="address" defaultValue={user?.address} rows="3" placeholder="Street, City, Country"></textarea>
                        </div>
                        <div className="full-width" style={{ display: 'flex', gap: '12px' }}>
                          <button type="submit" className="btn btn-primary">Update Profile Details</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowChangePasswordModal(true)}>Change Password</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'activity' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">System & Account Activity</h1>
                    <p className="page-sub">Comprehensive history of your account actions and system updates</p>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">Activity History</h3>
                    </div>
                    <div className="activity-report">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={i} className={`activity-row activity-${n.type}`}>
                          <div className="activity-icon">
                            {n.type === 'bill' && '📄'}
                            {n.type === 'payment' && '💰'}
                            {n.type === 'leak' && '💧'}
                            {n.type === 'system' && '⚙️'}
                          </div>
                          <div className="activity-main">
                            <div className="activity-msg">{n.message}</div>
                            <div className="activity-date">
                              {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="activity-tag">
                            {(n.type || 'info').toUpperCase()}
                          </div>
                        </div>
                      )) : (
                        <div className="empty-state">No activity found for this account.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'services' && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">Our Services</h1>
                    <p className="page-sub">Water and Sewerage Company of Lesotho</p>
                  </div>

                  <div className="services-grid">
                    <div className="service-card">
                      <div className="service-icon">💧</div>
                      <h3>Water Supply</h3>
                      <p>Domestic and commercial water supply across all 10 districts of Lesotho with tiered, affordable pricing.</p>
                    </div>
                    <div className="service-card">
                      <div className="service-icon">🚽</div>
                      <h3>Sewerage Services</h3>
                      <p>Wastewater collection and treatment services in urban areas, ensuring environmental protection.</p>
                    </div>
                    <div className="service-card">
                      <div className="service-icon">🔌</div>
                      <h3>New Connections</h3>
                      <p>Apply online for new water or sewerage connections. Processing takes 5-10 business days.</p>
                    </div>
                    <div className="service-card">
                      <div className="service-icon">📞</div>
                      <h3>Customer Support</h3>
                      <p>Contact our team at 22312449 or visit your nearest district office for any enquiries.</p>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">Current Tariff Tiers (2025)</h3>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr><th>Tier</th><th>Usage Range</th><th>Rate per m³</th><th>Customer Type</th></tr>
                        </thead>
                        <tbody>
                          {rates.map((r, idx) => (
                            <tr key={idx}>
                              <td><span className="tier-badge">{r.tier_name || `Tier ${idx + 1}`}</span></td>
                              <td>{r.usage_from} – {r.usage_to} m³</td>
                              <td className="highlight">M {r.rate_per_m3}</td>
                              <td>{r.customer_type}</td>
                            </tr>
                          ))}
                          {rates.length === 0 && (
                            <tr><td colSpan="4" className="empty-table">No rates available</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {(currentPage === 'customers' || currentPage === 'analytics' || currentPage === 'districts' || currentPage === 'rates' || currentPage === 'allbills') && (
                <div className="page active">
                  <div className="page-header">
                    <h1 className="page-title">
                      {currentPage === 'customers' && 'Customer Management'}
                      {currentPage === 'analytics' && 'Analytics Dashboard'}
                      {currentPage === 'districts' && 'District Performance'}
                      {currentPage === 'rates' && 'Rate Configuration'}
                      {currentPage === 'allbills' && 'Bill Management'}
                    </h1>
                    <p className="page-sub">
                      {currentPage === 'customers' && 'Manage all registered customer accounts'}
                      {currentPage === 'analytics' && 'View water usage and billing insights'}
                      {currentPage === 'districts' && 'Performance metrics by district'}
                      {currentPage === 'rates' && 'Configure billing rate tiers'}
                      {currentPage === 'allbills' && 'Monitor all customer bills'}
                    </p>
                  </div>

                  {currentPage === 'customers' && (
                    <div className="panel">
                      <div className="panel-head">
                        <h3 className="panel-title">Customer Directory</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => { setRegData({ account_id: '', full_name: '', district: 'Maseru', address: '', phone: '', email: '', password: '', role: 'customer' }); setShowAddCustomerModal(true); }}>+ Add Customer</button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr><th>Account ID</th><th>Full Name</th><th>District</th><th>Status</th><th>Balance</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                            {customers.map((c, idx) => (
                              <tr key={idx}>
                                <td className="customer-id">{c.account_id}</td>
                                <td>{c.full_name}</td>
                                <td>{c.district}</td>
                                <td><span className={`status-badge ${c.balance > 0 ? 'pending' : 'paid'}`}>{c.balance > 0 ? 'Unpaid' : 'Paid'}</span></td>
                                <td className="amount">M {c.balance?.toLocaleString()}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="btn btn-sm btn-outline" onClick={() => { setSelectedCustomer(c); setShowCustomerDetailsModal(true); }}>
                                      View
                                    </button>
                                    <button className="btn btn-sm btn-outline" onClick={() => { setSelectedCustomer(c); setUsageData({ ...usageData, prev: usage.find(u => u.account_id === c.account_id)?.meter_reading_current || '' }); setShowUsageModal(true); }}>
                                      + Usage
                                    </button>
                                    <button className="btn btn-sm btn-primary" onClick={() => { setSelectedCustomer(c); setShowBillModal(true); }}>
                                      Bill
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {currentPage === 'allbills' && (
                    <>
                      <div className="stats-grid">
                        <div className="stat-card"><div className="stat-label">Total Billed</div><div className="stat-value">M {allBillsStats.total_billed?.toLocaleString() || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Collected</div><div className="stat-value">M {allBillsStats.total_collected?.toLocaleString() || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Outstanding</div><div className="stat-value">M {allBillsStats.total_outstanding?.toLocaleString() || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Overdue Accounts</div><div className="stat-value">{allBillsStats.overdue_accounts || 0}</div></div>
                      </div>
                      <div className="panel">
                        <div className="table-container">
                          <table className="data-table">
                            <thead><tr><th>Bill ID</th><th>Account</th><th>Customer</th><th>Period</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                              {allBills.map((b, idx) => (
                                <tr key={idx}>
                                  <td>{b.bill_id}</td><td>{b.account_id}</td><td>{b.name}</td><td>{b.month}</td>
                                  <td className="amount">M {b.amount?.toLocaleString()}</td>
                                  <td><span className={`status-badge ${b.status === 'Paid' ? 'paid' : b.status === 'Overdue' ? 'overdue' : 'pending'}`}>{b.status}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {currentPage === 'rates' && (
                    <div className="panel">
                      <div className="panel-head">
                        <h3 className="panel-title">Rate Tiers</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => showToast('Rates saved')}>Save Changes</button>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead><tr><th>Tier</th><th>From (m³)</th><th>To (m³)</th><th>Rate (M/m³)</th><th>Customer Type</th><th>Sewer Surcharge</th></tr></thead>
                          <tbody>
                            {rates.map((r, idx) => (
                              <tr key={idx}>
                                <td>{r.tier_name}</td>
                                <td><input type="number" defaultValue={r.usage_from} className="table-input" /></td>
                                <td><input type="number" defaultValue={r.usage_to} className="table-input" /></td>
                                <td><input type="number" defaultValue={r.rate_per_m3} className="table-input" step="0.01" /></td>
                                <td><select defaultValue={r.customer_type} className="table-select"><option>Domestic</option><option>Commercial</option><option>Industrial</option></select></td>
                                <td>M {r.sewer_surcharge}/m³</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {currentPage === 'analytics' && (
                    <>
                      <div className="stats-grid">
                        <div className="stat-card"><div className="stat-label">Total Customers</div><div className="stat-value">{analytics?.stats?.total_customers || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Monthly Revenue</div><div className="stat-value">M {analytics?.stats?.monthly_revenue?.toLocaleString() || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Quarterly Revenue</div><div className="stat-value">M {analytics?.stats?.quarterly_revenue?.toLocaleString() || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Yearly Revenue</div><div className="stat-value">M {analytics?.stats?.yearly_revenue?.toLocaleString() || 0}</div></div>
                        <div className="stat-card"><div className="stat-label">Average Bill</div><div className="stat-value">M {Math.round(analytics?.stats?.avg_bill || 0)}</div></div>
                        <div className="stat-card"><div className="stat-label">Collection Rate</div><div className="stat-value">{Math.round(analytics?.stats?.collection_rate || 0)}%</div></div>
                      </div>
                      <div className="content-grid">
                        <div className="panel">
                          <h3 className="panel-title">Revenue by Quarter</h3>
                          <div className="chart-container" style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={quarterlyRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="label" type="category" width={50} />
                                <Tooltip formatter={(value) => `M ${value.toLocaleString()}`} />
                                <Bar dataKey="val" fill="#185FA5" radius={[0, 4, 4, 0]} name="Revenue" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="panel">
                          <h3 className="panel-title">Bill Status Breakdown</h3>
                          <div className="chart-container" style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={billBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="status" type="category" width={60} />
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Bar dataKey="pct" radius={[0, 4, 4, 0]} name="Percentage">
                                  {billBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {currentPage === 'districts' && (
                    <div className="panel">
                      <h3 className="panel-title">District Performance</h3>
                      <div className="chart-container" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(analytics?.districts || []).map(d => ({ name: d.district, balance: parseFloat(d.total_balance || 0) }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `M ${value.toLocaleString()}`} />
                            <Bar dataKey="balance" fill="#2582d4" radius={[4, 4, 0, 0]} name="Total Balance" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {/* Customer Details Modal */}
                  {showCustomerDetailsModal && selectedCustomer && (
                    <div className="modal-overlay">
                      <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                          <h3>Customer Profile: {selectedCustomer.full_name}</h3>
                          <button className="modal-close" onClick={() => setShowCustomerDetailsModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                          <div className="detail-grid">
                            <div className="detail-item"><strong>Account ID</strong> <span>{selectedCustomer.account_id}</span></div>
                            <div className="detail-item"><strong>Account Status</strong>
                              <span className={`status-badge ${selectedCustomer.is_active ? 'active' : 'blocked'}`} style={{ width: 'fit-content' }}>
                                {selectedCustomer.is_active ? '● Active' : '● Blocked'}
                              </span>
                            </div>
                            <div className="detail-item"><strong>District</strong> <span>{selectedCustomer.district}</span></div>
                            <div className="detail-item"><strong>Customer Type</strong> <span>{selectedCustomer.customer_type}</span></div>
                            <div className="detail-item"><strong>Phone Number</strong> <span>{selectedCustomer.phone || 'Not Provided'}</span></div>
                            <div className="detail-item"><strong>Email Address</strong> <span>{selectedCustomer.email || 'Not Provided'}</span></div>
                            <div className="detail-item"><strong>Residential Address</strong> <span>{selectedCustomer.address || 'Not Provided'}</span></div>
                            <div className="detail-item"><strong>Account Role</strong>
                              <select
                                value={selectedCustomer.role || 'customer'}
                                onChange={(e) => updateUserRole(selectedCustomer.account_id, e.target.value)}
                                style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--gray-200)', background: '#fff', fontSize: '14px', fontWeight: '500' }}
                              >
                                <option value="customer">Customer</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div className="detail-item"><strong>Total Balance</strong> <span className="text-danger" style={{ fontWeight: 'bold' }}>M {selectedCustomer.balance?.toLocaleString()}</span></div>
                          </div>

                          <div style={{ marginTop: '30px' }}>
                            <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ color: 'var(--primary-color)' }}>📊</span> Recent Usage History
                            </h4>
                            <div className="mini-table-wrapper">
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr><th>Month</th><th>Reading</th><th>Consumption</th></tr>
                                </thead>
                                <tbody>
                                  {usage.filter(u => u.account_id === selectedCustomer.account_id).slice(0, 5).map((u, i) => (
                                    <tr key={i}>
                                      <td>{u.month}</td>
                                      <td>{u.meter_reading_current}</td>
                                      <td style={{ color: 'var(--primary-color)', fontWeight: '500' }}>{u.consumption_m3} m³</td>
                                    </tr>
                                  ))}
                                  {usage.filter(u => u.account_id === selectedCustomer.account_id).length === 0 && (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No usage history found</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setEditCustomerData({ ...selectedCustomer });
                                setShowCustomerDetailsModal(false);
                                setShowEditCustomerModal(true);
                              }}
                            >
                              Edit Profile
                            </button>
                            <button
                              className={`btn btn-sm ${(selectedCustomer.is_active ?? 1) ? 'btn-outline' : 'btn-primary'}`}
                              onClick={async () => {
                                const newActive = !(selectedCustomer.is_active ?? 1);
                                const res = await fetch(`${API_BASE}/api/customers/${selectedCustomer.account_id}/status`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    is_active: newActive,
                                    admin_id: user.account_id
                                  })
                                });
                                if (res.ok) {
                                  showToast(newActive ? "Account Activated" : "Account Blocked");
                                  setShowCustomerDetailsModal(false);
                                  fetchCustomers();
                                }
                              }}
                            >
                              {(selectedCustomer.is_active ?? 1) ? 'Block Account' : 'Unblock Account'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{ color: '#ff4444', borderColor: '#ff4444' }}
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedCustomer.full_name}?`)) {
                                  const res = await fetch(`${API_BASE}/api/customers/${selectedCustomer.account_id}`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ admin_id: user.account_id })
                                  });
                                  if (res.ok) {
                                    showToast("Account Deleted");
                                    setShowCustomerDetailsModal(false);
                                    fetchCustomers();
                                  }
                                }
                              }}
                            >
                              Delete Account
                            </button>
                          </div>
                          <button className="btn btn-outline" onClick={() => setShowCustomerDetailsModal(false)}>Close</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Customer Modal */}
                  {showEditCustomerModal && (
                    <div className="modal-overlay">
                      <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                          <h3>Edit Customer: {editCustomerData.account_id}</h3>
                          <button className="modal-close" onClick={() => setShowEditCustomerModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="Full Name" value={editCustomerData.full_name || ''} onChange={(e) => setEditCustomerData({ ...editCustomerData, full_name: e.target.value })} />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>District</label>
                              <select value={editCustomerData.district || 'Maseru'} onChange={(e) => setEditCustomerData({ ...editCustomerData, district: e.target.value })}>
                                <option>Maseru</option><option>Leribe</option><option>Berea</option><option>Mafeteng</option>
                                <option>Mohale's Hoek</option><option>Quthing</option><option>Qacha's Nek</option>
                                <option>Mokhotlong</option><option>Thaba-Tseka</option><option>Butha-Buthe</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Customer Type</label>
                              <select value={editCustomerData.customer_type || 'Domestic'} onChange={(e) => setEditCustomerData({ ...editCustomerData, customer_type: e.target.value })}>
                                <option>Domestic</option>
                                <option>Commercial</option>
                                <option>Industrial</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Phone</label>
                              <input type="text" placeholder="Phone" value={editCustomerData.phone || ''} onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Email</label>
                              <input type="email" placeholder="Email" value={editCustomerData.email || ''} onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Address</label>
                            <input type="text" placeholder="Address" value={editCustomerData.address || ''} onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })} />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn btn-primary" onClick={async () => {
                            const res = await fetch(API_BASE + '/api/admin/customer/update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...editCustomerData, admin_id: user.account_id })
                            });
                            if (res.ok) {
                              showToast('Customer updated successfully');
                              setShowEditCustomerModal(false);
                              fetchCustomers();
                            } else {
                              showToast('Error updating customer');
                            }
                          }}>Save Changes</button>
                          <button className="btn btn-outline" onClick={() => setShowEditCustomerModal(false)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
