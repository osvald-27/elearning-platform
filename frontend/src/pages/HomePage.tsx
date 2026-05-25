import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function HomePage() {
  const [slide, setSlide] = useState(1);

  return (
    <main className="page hero-page">
      <Sidebar />

      <header className="site-header">
        <Link to="/" className="logo-link">
          <img src="/logo.png" alt="Fold logo" className="site-logo" />
        </Link>
      </header>

      <div className="home-slider">
        {/* Slide 1 */}
        <article className={`home-slide ${slide === 1 ? 'active' : ''}`}>
          <h1 className="hero-title hero-title-center">Welcome To</h1>
          <div className="hero-logo-large">
            <img src="/logo.png" alt="Fold logo" className="hero-logo-img" />
          </div>
          <p className="hero-subtitle">Where Knowledge Unfolds</p>
          <div className="hero-actions center">
            <button className="primary-btn" onClick={() => setSlide(2)}>Next</button>
          </div>
        </article>

        {/* Slide 2 */}
        <article className={`home-slide ${slide === 2 ? 'active' : ''}`}>
          <div className="hero-grid">
            <div className="hero-visual circle-visual">
              <div className="visual-circle">
                <img src="/book.svg" alt="Book" className="visual-svg large-svg" />
              </div>
            </div>
            <div className="hero-content">
              <h2 className="hero-title">
                <span className="text-dark">Learn</span>
                <span className="text-light"> From Home</span>
              </h2>
              <div className="hero-actions">
                <Link to="/get-started" className="primary-btn large-btn">Sign Up</Link>
                <button className="secondary-btn" onClick={() => setSlide(3)}>Next</button>
              </div>
            </div>
          </div>
        </article>

        {/* Slide 3 */}
        <article className={`home-slide ${slide === 3 ? 'active' : ''}`}>
          <div className="hero-grid reverse">
            <div className="hero-content">
              <h2 className="hero-title">
                <span className="text-dark">Build</span>
                <span className="text-light"> Your Future</span>
              </h2>
              <p className="section-text">
                Explore practical learning paths, guided lessons, and curated resources
                designed to help you grow from anywhere.
              </p>
              <div className="hero-actions">
                <Link to="/courses" className="primary-btn">Browse Courses</Link>
                <Link to="/about" className="secondary-link-btn">Learn More</Link>
              </div>
            </div>
            <div className="hero-visual circle-visual">
              <div className="visual-circle">
                <img src="/pencil.svg" alt="Pencil" className="visual-svg" />
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
