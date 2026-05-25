import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AboutPage() {
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
          <h1 className="page-title">About Fold</h1>
          <p className="section-text">
            Fold is a learning platform focused on accessible education,
            guided skill building, and flexible self-paced study.
          </p>
          <p className="section-text">
            The goal is to help learners study from anywhere through structured
            materials and practical course pathways designed for the University of Buea community.
          </p>
          <div className="hero-actions">
            <Link to="/get-started" className="primary-btn">Get Started</Link>
            <Link to="/courses" className="secondary-link-btn">Browse Courses</Link>
          </div>
        </div>
        <div className="split-visual">
          <div className="visual-circle medium">
            <img src="/logo.png" alt="Fold" className="visual-svg" />
          </div>
        </div>
      </section>
    </main>
  );
}
