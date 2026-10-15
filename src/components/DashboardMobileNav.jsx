import React from 'react';
import { 
  LayoutDashboard, FileText, Users, Wrench, 
  Banknote, UserCheck, LogOut, Sun, ShieldCheck 
} from 'lucide-react';

export default function DashboardMobileNav({ 
  role = 'agent', 
  activeTab, 
  setActiveTab, 
  tabs = [], 
  currentUser, 
  onLogout 
}) {
  return (
    <>
      {/* ----------------- MOBILE TOP APP BAR ----------------- */}
      <div className="mobile-app-top-bar">
        <div className="matb-left">
          <div className="matb-brand-badge">
            <Sun size={18} color="#fff" />
          </div>
          <div className="matb-info">
            <div className="matb-name">{currentUser?.fullName || 'My Account'}</div>
            <div className="matb-role">{role.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* ----------------- MOBILE BOTTOM DOCK ----------------- */}
      <nav className="mobile-app-bottom-dock">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon || LayoutDashboard;
          return (
            <button
              key={tab.id}
              type="button"
              className={`mabd-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="mabd-icon-wrap">
                <Icon size={20} />
                {Boolean(tab.badge) && tab.badge > 0 && (
                  <span className="mabd-badge">{tab.badge}</span>
                )}
              </div>
              <span className="mabd-label">{tab.label}</span>
              {isActive && <div className="mabd-active-indicator" />}
            </button>
          );
        })}
      </nav>
    </>
  );
}
