import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function GetStartedPage() {
  return (
    <main className="page inner-page">
      <Sidebar />
      <header className="site-header">
        <Link to="/" className="logo-link">
          <img src="/logo.png" alt="Fold logo" className="site-logo" />
        </Link>
      </header>

      <section className="split-section">
        <div className="split-content">
          <h1 className="page-title">Start Your Journey</h1>
          <p className="section-text">
            Create an account to access courses, track your progress, and continue learning
            at your own pace from anywhere.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="primary-btn">Create Account</Link>
            <Link to="/login" className="secondary-link-btn">I Already Have One</Link>
          </div>
        </div>
        <div className="split-visual">
          <div className="visual-circle medium">
            <img src="/book.svg" alt="Book" className="visual-svg" />
          </div>
        </div>
      </section>
    </main>
  );
}
