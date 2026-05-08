import os

app_content = r"""import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [currentRole, setCurrentRole] = useState('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'services'
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [loginUser, setLoginUser] = useState('WAS-00123');
  const [loginPass, setLoginPass] = useState('••••••••');

  const doLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
    setCurrentView('home');
  };

  const doLogout = () => {
    setIsLoggedIn(false);
  };

  const showPage = (id) => {
    setCurrentPage(id);
    setCurrentView('home');
  };

  const setView = (v) => {
    setCurrentView(v);
    if (v !== 'services') {
      setCurrentPage('dashboard');
    }
  };

  const processPayment = () => {
    showToast('Payment of M 285.40 processed successfully');
    setTimeout(() => showPage('bills'), 1200);
  };

  const submitLeak = () => {
    showToast('Leakage report submitted — ref #LK-2025-0481');
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); }, 2800);
  };

  let welcomeTitle = 'Welcome back, Teboho M.';
  if (currentRole === 'admin') welcomeTitle = 'Admin Dashboard';
  else if (currentRole === 'manager') welcomeTitle = 'Branch Manager Dashboard';

  const roleBadge = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  return (
    <>
      <div id="toast" style={{ opacity: toastVisible ? 1 : 0 }}>{toastMsg}</div>

      {!isLoggedIn && (
        <div className="app" id="loginView">
          <div className="login-wrap">
            <div className="login-card">
              <div className="login-logo">
                <div className="login-logo-mark">
                  <svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div className="login-title">WASCO</div>
                <div className="login-sub">Water and Sewerage Company<br />Lesotho</div>
              </div>
              <div className="role-tabs">
                <button className={`role-tab ${currentRole === 'customer' ? 'active' : ''}`} onClick={() => setCurrentRole('customer')}>Customer</button>
                <button className={`role-tab ${currentRole === 'admin' ? 'active' : ''}`} onClick={() => setCurrentRole('admin')}>Admin</button>
                <button className={`role-tab ${currentRole === 'manager' ? 'active' : ''}`} onClick={() => setCurrentRole('manager')}>Manager</button>
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Account / Username</label>
                <input type="text" id="loginUser" placeholder="e.g. WAS-00123" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" id="loginPass" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              </div>
              <div className="login-actions">
                <button className="btn btn-primary" onClick={doLogin}>Sign in</button>
                <button className="btn" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Register new account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <div className="app" id="appView">
          <div className="topbar">
            <div className="topbar-brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              WASCO Portal <span id="roleBadge">{roleBadge}</span>
            </div>
            <div className="topbar-nav">
              <button className={`tn ${currentView === 'services' ? 'active' : ''}`} id="tNav-services" onClick={() => setView('services')}>Services</button>
              <button className={`tn ${currentView === 'home' ? 'active' : ''}`} id="tNav-home" onClick={() => setView('home')}>Home</button>
              <button className="tn" onClick={doLogout}>Sign out</button>
            </div>
          </div>
          <div className="main">
            <div className="sidebar">
              <div className="sidebar-section">
                <div className="sidebar-label">Navigation</div>
                <button className={`slink ${currentPage === 'dashboard' && currentView === 'home' ? 'active' : ''}`} id="nav-dashboard" onClick={() => showPage('dashboard')}><span className="ico">◈</span>Dashboard</button>
                <button className={`slink ${currentPage === 'bills' && currentView === 'home' ? 'active' : ''}`} id="nav-bills" onClick={() => showPage('bills')}><span className="ico">◉</span>My Bills</button>
                <button className={`slink ${currentPage === 'usage' && currentView === 'home' ? 'active' : ''}`} id="nav-usage" onClick={() => showPage('usage')}><span className="ico">◎</span>Usage</button>
                <button className={`slink ${currentPage === 'payment' && currentView === 'home' ? 'active' : ''}`} id="nav-payment" onClick={() => showPage('payment')}><span className="ico">◌</span>Pay Bill</button>
                <button className={`slink ${currentPage === 'leakage' && currentView === 'home' ? 'active' : ''}`} id="nav-leakage" onClick={() => showPage('leakage')}><span className="ico">△</span>Report Leak</button>
              </div>
              
              {currentRole === 'admin' && (
                <div id="adminLinks">
                  <div className="sidebar-section" style={{ borderTop: '0.5px solid var(--color-border-tertiary)', marginTop: '4px', paddingTop: '12px' }}>
                    <div className="sidebar-label">Admin</div>
                    <button className={`slink ${currentPage === 'customers' && currentView === 'home' ? 'active' : ''}`} id="nav-customers" onClick={() => showPage('customers')}><span className="ico">◑</span>Customers</button>
                    <button className={`slink ${currentPage === 'rates' && currentView === 'home' ? 'active' : ''}`} id="nav-rates" onClick={() => showPage('rates')}><span className="ico">◐</span>Bill Rates</button>
                    <button className={`slink ${currentPage === 'allbills' && currentView === 'home' ? 'active' : ''}`} id="nav-allbills" onClick={() => showPage('allbills')}><span className="ico">▣</span>All Bills</button>
                  </div>
                </div>
              )}
              
              {currentRole === 'manager' && (
                <div id="managerLinks">
                  <div className="sidebar-section" style={{ borderTop: '0.5px solid var(--color-border-tertiary)', marginTop: '4px', paddingTop: '12px' }}>
                    <div className="sidebar-label">Reports</div>
                    <button className={`slink ${currentPage === 'analytics' && currentView === 'home' ? 'active' : ''}`} id="nav-analytics" onClick={() => showPage('analytics')}><span className="ico">▦</span>Analytics</button>
                    <button className={`slink ${currentPage === 'districts' && currentView === 'home' ? 'active' : ''}`} id="nav-districts" onClick={() => showPage('districts')}><span className="ico">▩</span>Districts</button>
                  </div>
                </div>
              )}
            </div>

            <div className="content">
              {/* DASHBOARD */}
              {currentPage === 'dashboard' && currentView !== 'services' && (
                <div className="page active" id="page-dashboard">
                  <div className="page-title">{welcomeTitle}</div>
                  <div className="page-sub">Account WAS-00123 · Maseru South</div>
                  <div className="bill-hero">
                    <div className="bill-hero-name">Current bill — April 2025</div>
                    <div className="bill-hero-amount">M 285.40</div>
                    <div className="bill-hero-meta">
                      <span>Due: 30 Apr 2025</span>
                      <span>Usage: 18.2 m³</span>
                      <span>Status: Pending</span>
                    </div>
                  </div>
                  <div className="cards-row">
                    <div className="mcard"><div className="mcard-label">Last payment</div><div className="mcard-val">M 247</div><div className="mcard-sub">Mar 2025</div></div>
                    <div className="mcard"><div className="mcard-label">Avg usage</div><div className="mcard-val">16.4 m³</div><div className="mcard-sub">Last 6 months</div></div>
                    <div className="mcard"><div className="mcard-label">Outstanding</div><div className="mcard-val">M 285</div><div className="mcard-sub">1 bill</div></div>
                    <div className="mcard"><div className="mcard-label">Account</div><div className="mcard-val" style={{ fontSize: '14px' }}>Active</div><div className="mcard-sub">Since 2019</div></div>
                  </div>
                  <div className="two-col">
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Recent notifications</div></div>
                      <div className="notif-item"><div className="notif-dot dot-amber"></div><div><div className="notif-text">Your April bill of M285.40 is due in 10 days</div><div className="notif-time">2 days ago</div></div></div>
                      <div className="notif-item"><div className="notif-dot dot-green"></div><div><div className="notif-text">March bill payment of M247 confirmed</div><div className="notif-time">1 month ago</div></div></div>
                      <div className="notif-item"><div className="notif-dot dot-blue"></div><div><div className="notif-text">Scheduled maintenance: Maseru South — 22 Apr</div><div className="notif-time">3 days ago</div></div></div>
                    </div>
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Usage this month</div><div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>18.2 m³</div></div>
                      <div className="usage-meter">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}><span>0</span><span>Tier 1 (0–10)</span><span>Tier 2 (10–30)</span></div>
                        <div className="usage-track"><div className="usage-fill" style={{ width: '61%' }}></div></div>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <div className="tier-row"><span>Tier 1: 0–10 m³</span><span className="tier-badge t1">M 8.50/m³</span><span>M 85.00</span></div>
                        <div className="tier-row"><span>Tier 2: 10–30 m³</span><span className="tier-badge t2">M 11.20/m³</span><span>M 92.40</span></div>
                        <div className="tier-row" style={{ fontWeight: 500 }}><span>Sewerage surcharge</span><span></span><span>M 108.00</span></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => showPage('payment')}>Pay now — M 285.40</button>
                    <button className="btn" onClick={() => showPage('bills')}>View all bills</button>
                  </div>
                </div>
              )}

              {/* BILLS */}
              {currentPage === 'bills' && currentView !== 'services' && (
                <div className="page active" id="page-bills">
                  <div className="page-title">My Bills</div>
                  <div className="page-sub">Payment history and current balance</div>
                  <div className="panel">
                    <table>
                      <thead><tr><th>Bill ID</th><th>Period</th><th>Usage (m³)</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        <tr><td>BL-2025-04</td><td>April 2025</td><td>18.2</td><td>M 285.40</td><td><span className="badge b-pending">Pending</span></td><td><button className="btn btn-sm btn-primary" onClick={() => showPage('payment')}>Pay</button></td></tr>
                        <tr><td>BL-2025-03</td><td>March 2025</td><td>15.8</td><td>M 247.00</td><td><span className="badge b-paid">Paid</span></td><td><button className="btn btn-sm">Receipt</button></td></tr>
                        <tr><td>BL-2025-02</td><td>February 2025</td><td>14.1</td><td>M 218.50</td><td><span className="badge b-paid">Paid</span></td><td><button className="btn btn-sm">Receipt</button></td></tr>
                        <tr><td>BL-2025-01</td><td>January 2025</td><td>19.7</td><td>M 308.00</td><td><span className="badge b-paid">Paid</span></td><td><button className="btn btn-sm">Receipt</button></td></tr>
                        <tr><td>BL-2024-12</td><td>December 2024</td><td>22.4</td><td>M 356.80</td><td><span className="badge b-paid">Paid</span></td><td><button className="btn btn-sm">Receipt</button></td></tr>
                        <tr><td>BL-2024-11</td><td>November 2024</td><td>11.9</td><td>M 187.40</td><td><span className="badge b-paid">Paid</span></td><td><button className="btn btn-sm">Receipt</button></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* USAGE */}
              {currentPage === 'usage' && currentView !== 'services' && (
                <div className="page active" id="page-usage">
                  <div className="page-title">Water Usage</div>
                  <div className="page-sub">Monthly consumption — account WAS-00123</div>
                  <div className="cards-row">
                    <div className="mcard"><div className="mcard-label">This month</div><div className="mcard-val">18.2 m³</div></div>
                    <div className="mcard"><div className="mcard-label">Last month</div><div className="mcard-val">15.8 m³</div></div>
                    <div className="mcard"><div className="mcard-label">6-month avg</div><div className="mcard-val">16.4 m³</div></div>
                    <div className="mcard"><div className="mcard-label">YTD total</div><div className="mcard-val">88.0 m³</div></div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Monthly usage (m³)</div></div>
                    <div className="chart-bar-wrap">
                      <div className="chart-bar-row"><span className="chart-bar-label">Nov</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '53%', background: '#185FA5' }}>11.9</div></div></div>
                      <div className="chart-bar-row"><span className="chart-bar-label">Dec</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '100%', background: '#185FA5' }}>22.4</div></div></div>
                      <div className="chart-bar-row"><span className="chart-bar-label">Jan</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '88%', background: '#185FA5' }}>19.7</div></div></div>
                      <div className="chart-bar-row"><span className="chart-bar-label">Feb</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '63%', background: '#185FA5' }}>14.1</div></div></div>
                      <div className="chart-bar-row"><span className="chart-bar-label">Mar</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '70%', background: '#185FA5' }}>15.8</div></div></div>
                      <div className="chart-bar-row"><span className="chart-bar-label">Apr</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '81%', background: '#EF9F27' }}>18.2 ←current</div></div></div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Meter readings</div></div>
                    <table>
                      <thead><tr><th>Month</th><th>Previous (m³)</th><th>Current (m³)</th><th>Consumption</th></tr></thead>
                      <tbody>
                        <tr><td>April 2025</td><td>1,284.6</td><td>1,302.8</td><td>18.2 m³</td></tr>
                        <tr><td>March 2025</td><td>1,268.8</td><td>1,284.6</td><td>15.8 m³</td></tr>
                        <tr><td>February 2025</td><td>1,254.7</td><td>1,268.8</td><td>14.1 m³</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAY BILL */}
              {currentPage === 'payment' && currentView !== 'services' && (
                <div className="page active" id="page-payment">
                  <div className="page-title">Pay Bill</div>
                  <div className="page-sub">Secure online payment via WASCO gateway</div>
                  <div className="two-col">
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Bill summary</div></div>
                      <div className="info-grid">
                        <div className="info-item"><div className="info-item-label">Account</div><div className="info-item-val">WAS-00123</div></div>
                        <div className="info-item"><div className="info-item-label">Period</div><div className="info-item-val">April 2025</div></div>
                        <div className="info-item"><div className="info-item-label">Usage</div><div className="info-item-val">18.2 m³</div></div>
                        <div className="info-item"><div className="info-item-label">Total due</div><div className="info-item-val" style={{ color: 'var(--wasco-blue)' }}>M 285.40</div></div>
                      </div>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                        <div className="tier-row"><span style={{ color: 'var(--color-text-secondary)' }}>Water charges</span><span>M 177.40</span></div>
                        <div className="tier-row"><span style={{ color: 'var(--color-text-secondary)' }}>Sewerage</span><span>M 108.00</span></div>
                        <div className="tier-row" style={{ fontWeight: 500 }}><span>Total</span><span>M 285.40</span></div>
                      </div>
                    </div>
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Payment details</div></div>
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label>Payment method</label>
                        <select>
                          <option>Credit / Debit Card</option>
                          <option>Mobile Money (M-PESA)</option>
                          <option>Bank Transfer</option>
                          <option>WASCO Wallet</option>
                        </select>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Card number</label>
                          <input type="text" placeholder="**** **** **** 1234" />
                        </div>
                        <div className="form-group">
                          <label>Expiry</label>
                          <input type="text" placeholder="MM/YY" />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Cardholder name</label>
                          <input type="text" placeholder="Full name" />
                        </div>
                        <div className="form-group">
                          <label>CVV</label>
                          <input type="text" placeholder="***" />
                        </div>
                      </div>
                      <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={processPayment}>Pay M 285.40 securely</button>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🔒</span> Payments secured by 256-bit TLS encryption
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT LEAK */}
              {currentPage === 'leakage' && currentView !== 'services' && (
                <div className="page active" id="page-leakage">
                  <div className="page-title">Report a Water Leakage</div>
                  <div className="page-sub">Help us fix issues in your community</div>
                  <div className="two-col">
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Submit a report</div></div>
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label>District</label>
                        <select>
                          <option>Maseru</option><option>Leribe</option><option>Berea</option><option>Butha-Buthe</option>
                          <option>Thaba-Tseka</option><option>Mokhotlong</option><option>Qacha's Nek</option>
                          <option>Quthing</option><option>Mohale's Hoek</option><option>Mafeteng</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label>Street / Area description</label>
                        <input type="text" placeholder="e.g. Kingsway near roundabout" />
                      </div>
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label>Severity</label>
                        <select><option>Minor drip</option><option>Moderate leak</option><option>Major burst</option></select>
                      </div>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label>Additional details</label>
                        <input type="text" placeholder="Describe the issue..." />
                      </div>
                      <button className="btn btn-primary" onClick={submitLeak}>Submit report</button>
                    </div>
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Recent reports — Maseru</div></div>
                      <div className="leakage-card"><div className="lc-body"><div className="lc-title">Kingsway Road, near Parliament</div><div className="lc-meta">Major burst · Reported 2h ago</div></div><span className="badge b-overdue">Open</span></div>
                      <div className="leakage-card"><div className="lc-body"><div className="lc-title">Lancers Inn area, Maseru</div><div className="lc-meta">Moderate leak · Reported 1d ago</div></div><span className="badge b-pending">In progress</span></div>
                      <div className="leakage-card"><div className="lc-body"><div className="lc-title">Ha Hoohlo residential</div><div className="lc-meta">Minor drip · Reported 3d ago</div></div><span className="badge b-paid">Resolved</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* PUBLIC SERVICES */}
              {currentView === 'services' && (
                <div className="page active" id="page-services">
                  <div className="page-title">WASCO Services</div>
                  <div className="page-sub">Water and Sewerage Company of Lesotho — available services</div>
                  <div className="two-col">
                    <div className="panel"><div className="panel-title" style={{ marginBottom: '10px' }}>Water supply</div><p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Domestic and commercial water supply across all 10 districts of Lesotho with tiered pricing.</p></div>
                    <div className="panel"><div className="panel-title" style={{ marginBottom: '10px' }}>Sewerage</div><p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Wastewater collection and treatment services in urban areas.</p></div>
                    <div className="panel"><div className="panel-title" style={{ marginBottom: '10px' }}>New connections</div><p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Apply online for a new water or sewerage connection. Processing takes 5–10 business days.</p></div>
                    <div className="panel"><div className="panel-title" style={{ marginBottom: '10px' }}>Bill enquiries</div><p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Contact WASCO at 22312449 or visit your nearest district office for billing queries.</p></div>
                  </div>
                  <div className="panel" style={{ marginTop: 0 }}>
                    <div className="panel-head"><div className="panel-title">Current tariff tiers (2025)</div></div>
                    <table>
                      <thead><tr><th>Tier</th><th>Usage range</th><th>Rate (per m³)</th><th>Customer type</th></tr></thead>
                      <tbody>
                        <tr><td><span className="tier-badge t1">Tier 1</span></td><td>0 – 10 m³</td><td>M 8.50</td><td>Domestic</td></tr>
                        <tr><td><span className="tier-badge t2">Tier 2</span></td><td>10 – 30 m³</td><td>M 11.20</td><td>Domestic</td></tr>
                        <tr><td><span className="tier-badge t3">Tier 3</span></td><td>30 – 60 m³</td><td>M 15.80</td><td>Commercial</td></tr>
                        <tr><td><span className="tier-badge t4">Tier 4</span></td><td>60+ m³</td><td>M 22.40</td><td>Industrial</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN: CUSTOMERS */}
              {currentPage === 'customers' && currentView !== 'services' && currentRole === 'admin' && (
                <div className="page active" id="page-customers">
                  <div className="page-title">Manage Customers</div>
                  <div className="page-sub">Add, edit and view all registered accounts</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input type="text" placeholder="Search by name or account..." style={{ maxWidth: '280px' }} />
                    <button className="btn btn-primary" onClick={() => showToast('Add customer form opened')}>+ Add customer</button>
                  </div>
                  <div className="panel">
                    <table>
                      <thead><tr><th>Account</th><th>Name</th><th>District</th><th>Address</th><th>Status</th><th>Balance</th><th></th></tr></thead>
                      <tbody>
                        <tr><td>WAS-00123</td><td>Teboho Mokoena</td><td>Maseru</td><td>Ha Hoohlo</td><td><span className="badge b-active">Active</span></td><td>M 285</td><td><button className="btn btn-sm" onClick={() => showToast('Editing WAS-00123')}>Edit</button></td></tr>
                        <tr><td>WAS-00124</td><td>Lineo Ntlale</td><td>Leribe</td><td>Hlotse Main</td><td><span className="badge b-active">Active</span></td><td>M 0</td><td><button className="btn btn-sm" onClick={() => showToast('Editing WAS-00124')}>Edit</button></td></tr>
                        <tr><td>WAS-00125</td><td>Matlohang Sello</td><td>Berea</td><td>Teyateyaneng</td><td><span className="badge b-overdue">Overdue</span></td><td>M 712</td><td><button className="btn btn-sm" onClick={() => showToast('Editing WAS-00125')}>Edit</button></td></tr>
                        <tr><td>WAS-00126</td><td>Retselisitsoe Tau</td><td>Maseru</td><td>Mafeteng Rd</td><td><span className="badge b-active">Active</span></td><td>M 190</td><td><button className="btn btn-sm" onClick={() => showToast('Editing WAS-00126')}>Edit</button></td></tr>
                        <tr><td>WAS-00127</td><td>Nthabi Ramaema</td><td>Mafeteng</td><td>Mafeteng Town</td><td><span className="badge b-pending">Pending</span></td><td>M 445</td><td><button className="btn btn-sm" onClick={() => showToast('Editing WAS-00127')}>Edit</button></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN: RATES */}
              {currentPage === 'rates' && currentView !== 'services' && currentRole === 'admin' && (
                <div className="page active" id="page-rates">
                  <div className="page-title">Billing Rates</div>
                  <div className="page-sub">Configure tariff tiers and rates</div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Current rate tiers</div><button className="btn btn-sm btn-primary" onClick={() => showToast('Rate saved')}>Save changes</button></div>
                    <table>
                      <thead><tr><th>Tier</th><th>Usage from (m³)</th><th>Usage to (m³)</th><th>Rate (M/m³)</th><th>Customer type</th><th>Sewer surcharge</th></tr></thead>
                      <tbody>
                        <tr><td>Tier 1</td><td><input type="number" defaultValue="0" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="10" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="8.50" style={{ width: '80px' }} /></td><td><select style={{ width: '110px' }}><option>Domestic</option><option>Commercial</option></select></td><td>M 6.00/m³</td></tr>
                        <tr><td>Tier 2</td><td><input type="number" defaultValue="10" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="30" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="11.20" style={{ width: '80px' }} /></td><td><select style={{ width: '110px' }}><option>Domestic</option></select></td><td>M 6.00/m³</td></tr>
                        <tr><td>Tier 3</td><td><input type="number" defaultValue="30" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="60" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="15.80" style={{ width: '80px' }} /></td><td><select style={{ width: '110px' }}><option>Commercial</option></select></td><td>M 8.50/m³</td></tr>
                        <tr><td>Tier 4</td><td><input type="number" defaultValue="60" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="9999" style={{ width: '70px' }} /></td><td><input type="number" defaultValue="22.40" style={{ width: '80px' }} /></td><td><select style={{ width: '110px' }}><option>Industrial</option></select></td><td>M 12.00/m³</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN: ALL BILLS */}
              {currentPage === 'allbills' && currentView !== 'services' && currentRole === 'admin' && (
                <div className="page active" id="page-allbills">
                  <div className="page-title">All Bills</div>
                  <div className="page-sub">View and manage billing across all customers</div>
                  <div className="cards-row">
                    <div className="mcard"><div className="mcard-label">Total billed (Apr)</div><div className="mcard-val">M 48,320</div></div>
                    <div className="mcard"><div className="mcard-label">Collected</div><div className="mcard-val">M 31,450</div></div>
                    <div className="mcard"><div className="mcard-label">Outstanding</div><div className="mcard-val">M 16,870</div></div>
                    <div className="mcard"><div className="mcard-label">Overdue accounts</div><div className="mcard-val">47</div></div>
                  </div>
                  <div className="panel">
                    <table>
                      <thead><tr><th>Bill ID</th><th>Account</th><th>Customer</th><th>Period</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr><td>BL-2025-04-0123</td><td>WAS-00123</td><td>Teboho Mokoena</td><td>Apr 2025</td><td>M 285.40</td><td><span className="badge b-pending">Pending</span></td></tr>
                        <tr><td>BL-2025-04-0124</td><td>WAS-00124</td><td>Lineo Ntlale</td><td>Apr 2025</td><td>M 198.20</td><td><span className="badge b-paid">Paid</span></td></tr>
                        <tr><td>BL-2025-04-0125</td><td>WAS-00125</td><td>Matlohang Sello</td><td>Apr 2025</td><td>M 712.00</td><td><span className="badge b-overdue">Overdue</span></td></tr>
                        <tr><td>BL-2025-04-0126</td><td>WAS-00126</td><td>Retselisitsoe Tau</td><td>Apr 2025</td><td>M 190.80</td><td><span className="badge b-pending">Pending</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MANAGER: ANALYTICS */}
              {currentPage === 'analytics' && currentView !== 'services' && currentRole === 'manager' && (
                <div className="page active" id="page-analytics">
                  <div className="page-title">Analytics & Insights</div>
                  <div className="page-sub">Water usage and billing overview — all Lesotho districts</div>
                  <div className="cards-row">
                    <div className="mcard"><div className="mcard-label">Total customers</div><div className="mcard-val">12,847</div><div className="mcard-sub">+3.2% YoY</div></div>
                    <div className="mcard"><div className="mcard-label">Monthly revenue</div><div className="mcard-val">M 2.1M</div><div className="mcard-sub">Apr 2025</div></div>
                    <div className="mcard"><div className="mcard-label">Avg bill</div><div className="mcard-val">M 163</div><div className="mcard-sub">Per account</div></div>
                    <div className="mcard"><div className="mcard-label">Collection rate</div><div className="mcard-val">78.4%</div><div className="mcard-sub">Target: 85%</div></div>
                  </div>
                  <div className="two-col">
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Revenue by quarter (M thousands)</div></div>
                      <div className="chart-bar-wrap">
                        <div className="chart-bar-row"><span className="chart-bar-label" style={{ width: '40px' }}>Q1 24</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '72%', background: '#185FA5' }}>1,820</div></div></div>
                        <div className="chart-bar-row"><span className="chart-bar-label" style={{ width: '40px' }}>Q2 24</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '80%', background: '#185FA5' }}>2,010</div></div></div>
                        <div className="chart-bar-row"><span className="chart-bar-label" style={{ width: '40px' }}>Q3 24</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '76%', background: '#185FA5' }}>1,910</div></div></div>
                        <div className="chart-bar-row"><span className="chart-bar-label" style={{ width: '40px' }}>Q4 24</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '88%', background: '#185FA5' }}>2,205</div></div></div>
                        <div className="chart-bar-row"><span className="chart-bar-label" style={{ width: '40px' }}>Q1 25</span><div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: '85%', background: '#EF9F27' }}>2,130 ←</div></div></div>
                      </div>
                    </div>
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Bill status breakdown (Apr 2025)</div></div>
                      <div className="tier-row"><span>Paid</span><div style={{ flex: 1, margin: '0 10px', height: '8px', background: 'var(--color-background-secondary)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: '65%', height: '100%', background: '#639922', borderRadius: '4px' }}></div></div><span>65%</span></div>
                      <div className="tier-row"><span>Pending</span><div style={{ flex: 1, margin: '0 10px', height: '8px', background: 'var(--color-background-secondary)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: '22%', height: '100%', background: '#EF9F27', borderRadius: '4px' }}></div></div><span>22%</span></div>
                      <div className="tier-row" style={{ border: 'none' }}><span>Overdue</span><div style={{ flex: 1, margin: '0 10px', height: '8px', background: 'var(--color-background-secondary)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: '13%', height: '100%', background: '#E24B4A', borderRadius: '4px' }}></div></div><span>13%</span></div>
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Customer segments</div>
                        <div className="tier-row"><span className="tier-badge t1">Domestic</span><span style={{ fontSize: '13px' }}>9,840 accounts</span></div>
                        <div className="tier-row"><span className="tier-badge t2">Commercial</span><span style={{ fontSize: '13px' }}>2,614 accounts</span></div>
                        <div className="tier-row" style={{ border: 'none' }}><span className="tier-badge t3">Industrial</span><span style={{ fontSize: '13px' }}>393 accounts</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MANAGER: DISTRICTS */}
              {currentPage === 'districts' && currentView !== 'services' && currentRole === 'manager' && (
                <div className="page active" id="page-districts">
                  <div className="page-title">District Reports</div>
                  <div className="page-sub">Water usage and billing by district — all 10 districts of Lesotho</div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Usage by district (m³ × 1000, April 2025)</div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Maseru</span><div className="district-bar"><div className="district-fill" style={{ width: '100%', background: '#185FA5' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>42,800</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Leribe</span><div className="district-bar"><div className="district-fill" style={{ width: '58%', background: '#378ADD' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>24,840</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Berea</span><div className="district-bar"><div className="district-fill" style={{ width: '41%', background: '#378ADD' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>17,550</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Mafeteng</span><div className="district-bar"><div className="district-fill" style={{ width: '35%', background: '#85B7EB' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>14,980</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Mohale's Hoek</span><div className="district-bar"><div className="district-fill" style={{ width: '28%', background: '#85B7EB' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>11,990</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Butha-Buthe</span><div className="district-bar"><div className="district-fill" style={{ width: '22%', background: '#B5D4F4' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>9,420</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Thaba-Tseka</span><div className="district-bar"><div className="district-fill" style={{ width: '18%', background: '#B5D4F4' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>7,710</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Quthing</span><div className="district-bar"><div className="district-fill" style={{ width: '14%', background: '#B5D4F4' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>5,990</span></div>
                      <div className="district-row"><span style={{ width: '110px', fontSize: '13px' }}>Qacha's Nek</span><div className="district-bar"><div className="district-fill" style={{ width: '11%', background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>4,710</span></div>
                      <div className="district-row" style={{ border: 'none' }}><span style={{ width: '110px', fontSize: '13px' }}>Mokhotlong</span><div className="district-bar"><div className="district-fill" style={{ width: '9%', background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}></div></div><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '60px', textAlign: 'right' }}>3,850</span></div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Collection rates by district</div></div>
                    <table>
                      <thead><tr><th>District</th><th>Accounts</th><th>Billed</th><th>Collected</th><th>Rate</th></tr></thead>
                      <tbody>
                        <tr><td>Maseru</td><td>5,210</td><td>M 842,000</td><td>M 698,000</td><td><span className="badge b-active">82.9%</span></td></tr>
                        <tr><td>Leribe</td><td>2,840</td><td>M 421,000</td><td>M 312,000</td><td><span className="badge b-pending">74.1%</span></td></tr>
                        <tr><td>Berea</td><td>1,920</td><td>M 289,000</td><td>M 198,000</td><td><span className="badge b-pending">68.5%</span></td></tr>
                        <tr><td>Mafeteng</td><td>1,104</td><td>M 198,000</td><td>M 168,000</td><td><span className="badge b-active">84.8%</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
"""

with open(r"c:\Users\sekho\Desktop\DB Application\wasco\src\App.js", "w", encoding="utf-8") as f:
    f.write(app_content)

print("Successfully restored the correct App.js with the user's element IDs.")
