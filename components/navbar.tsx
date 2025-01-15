import React from "react";

export const Navbar = ({ children }) => {
  return (
    <nav className="navbar">
      {children}
      <style jsx>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </nav>
  );
};

export const NavbarBrand = ({ children }) => {
  return (
    <div className="navbar-brand">
      {children}
      <style jsx>{`
        .navbar-brand {
          font-size: 1.5rem;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export const NavbarContent = ({ children }) => {
  return (
    <div className="navbar-content">
      {children}
      <style jsx>{`
        .navbar-content {
          display: flex;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};
