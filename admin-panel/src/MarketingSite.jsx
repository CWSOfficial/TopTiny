import React from 'react';

const cities = [
  { name: 'Milwaukee', state: 'WI', mark: '01', photo: 'https://images.unsplash.com/photo-1786631586832-45bed9dd0c9e?auto=format&fit=crop&w=900&q=82', alt: 'Milwaukee skyline along Lake Michigan' },
  { name: 'Chicago', state: 'IL', mark: '02', photo: 'https://images.unsplash.com/photo-1747353179126-f00b85aeceae?auto=format&fit=crop&w=900&q=82', alt: 'Chicago skyline reflected in Cloud Gate' },
  { name: 'Phoenix', state: 'AZ', mark: '03', photo: 'https://images.unsplash.com/photo-1688066212257-3bb83619d81b?auto=format&fit=crop&w=900&q=82', alt: 'Downtown Phoenix with Camelback Mountain' },
  { name: 'Austin', state: 'TX', mark: '04', photo: 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?auto=format&fit=crop&w=900&q=82', alt: 'Austin skyline and Congress Avenue Bridge' },
];

const faqs = [
  {
    question: 'What is TopTini?',
    answer: 'TopTini is a city guide for discovering and rating espresso martinis at bars and restaurants.',
  },
  {
    question: 'How are scores calculated?',
    answer: 'People rate a drink from 0.0 to 10.0. Venue scores update as published community ratings are added, and city rankings account for both average score and rating volume.',
  },
  {
    question: 'Can I suggest a venue?',
    answer: 'Yes. Members can suggest a venue. Suggestions are checked for duplicates, location accuracy, and menu evidence before they are added to the public guide.',
  },
  {
    question: 'Can I add a photo to a review?',
    answer: 'You can attach a drink photo to a venue review. Review photos and published reviews are visible to other TopTini users.',
  },
  {
    question: 'Are all venue listings verified?',
    answer: 'Some listings may be marked as demo placeholders while the guide is being prepared. Check the venue details and its menu before making plans.',
  },
];

const pageInfo = {
  about: { eyebrow: 'OUR POINT OF VIEW', title: 'A city guide, down to the last pour.', intro: 'TopTini helps espresso martini people find the bars, restaurants, and drinks worth sharing.' },
  privacy: { eyebrow: 'YOUR INFORMATION', title: 'Privacy policy', intro: 'A plain-language overview of the information TopTini uses to run accounts, reviews, venue suggestions, and the city guide.' },
  terms: { eyebrow: 'USING TOPTINI', title: 'Terms and conditions', intro: 'A few clear ground rules for using the TopTini guide and contributing to its community.' },
  faq: { eyebrow: 'GOOD TO KNOW', title: 'Frequently asked questions', intro: 'A quick guide to ratings, photos, venue suggestions, and how the city guide works.' },
  contact: { eyebrow: 'WE ARE HERE TO HELP', title: 'Contact TopTini', intro: 'Questions, corrections, or feedback about a venue? We want to hear from you.' },
};

export default function MarketingSite({ page }) {
  const info = pageInfo[page];
  const isHome = page === 'home';
  return (
    <div className="marketing-site">
      <SiteHeader />
      {isHome ? <HomePage /> : info ? <EditorialPage page={page} info={info} /> : <NotFoundPage />}
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="marketing-header">
      <a className="marketing-brand" href="/" aria-label="TopTini home">
        <img src="/brand/toptini-app-icon.png" alt="" />
        <span>TopTini</span>
      </a>
      <nav className="marketing-nav" aria-label="Main navigation">
        <a href="/about">About</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms-and-conditions">Terms &amp; Conditions</a>
        <a href="/faq">FAQ</a>
        <a href="/contact">Contact</a>
      </nav>
      <a className="marketing-admin-link" href="/admin">Admin sign in <span aria-hidden="true">↗</span></a>
    </header>
  );
}

function HomePage() {
  return (
    <main>
      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="marketing-eyebrow"><span /> THE ESPRESSO MARTINI CITY GUIDE</p>
          <h1>Find your next<br /><em>favorite pour.</em></h1>
          <p className="marketing-lede">Discover espresso martinis around the city, compare community ratings, and share the places you love.</p>
          <div className="marketing-hero-actions">
            <a className="marketing-button light" href="#cities">Explore city guides <span>↓</span></a>
            <a className="marketing-text-link" href="/about">Get to know TopTini <span>↗</span></a>
          </div>
          <div className="marketing-hero-foot"><span className="hero-star">✳</span><span>Built around the drink.<br /><strong>Shaped by the people who order it.</strong></span></div>
        </div>
        <div className="marketing-hero-art">
          <img className="hero-feature-image" src="https://images.unsplash.com/photo-1790947167384-550d5f9e2e51?auto=format&fit=crop&w=1400&q=85" alt="Espresso martini with a coffee garnish" fetchPriority="high" />
          <div className="hero-art-caption"><span>YOUR NEXT CITY FIND</span><b>01 / 04</b></div>
          <div className="hero-art-city">MILWAUKEE <span>·</span> CHICAGO <span>·</span> PHOENIX <span>·</span> AUSTIN</div>
        </div>
      </section>

      <section className="marketing-intro section-wrap" id="about">
        <div className="section-kicker">A GUIDE WITH A POINT OF VIEW</div>
        <div className="marketing-intro-grid">
          <h2>Not just a place to go.<br /><em>A pour worth the trip.</em></h2>
          <p>TopTini brings the espresso martini conversation into one place: local spots, honest ratings, useful reviews, and a growing guide shaped by the community.</p>
        </div>
      </section>

      <section className="city-section section-wrap" id="cities">
        <div className="section-heading-row">
          <div><div className="section-kicker">START WITH YOUR CITY</div><h2>Good nights begin nearby.</h2></div>
          <span className="section-index">FOUR CITY GUIDES <b>↘</b></span>
        </div>
        <div className="marketing-city-grid">
          {cities.map(city => (
            <article className="marketing-city-card" key={city.name}>
              <span className="city-card-index">{city.mark}</span>
              <img className="city-card-image" src={city.photo} alt={city.alt} loading="lazy" />
              <span className="city-card-shade" aria-hidden="true" />
              <div className="city-card-bottom"><div><h3>{city.name}</h3><p>{city.state} <span>·</span> CITY GUIDE</p></div><span className="city-card-arrow">↗</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-band">
        <div className="section-wrap feature-band-inner">
          <div><div className="section-kicker light-kicker">THE TOPTINI WAY</div><h2>Find it. Rate it.<br /><em>Pass the good one on.</em></h2></div>
          <div className="feature-list">
            <Feature number="01" title="Explore locally" text="Browse a focused guide to espresso martinis in the cities you love." />
            <Feature number="02" title="Trust the details" text="See community scores, venue notes, and drink photos in one place." />
            <Feature number="03" title="Add your voice" text="Rate a pour or suggest a venue for review by the TopTini team." />
          </div>
        </div>
      </section>

      <section className="marketing-cta section-wrap">
        <div><div className="section-kicker">THE NEXT ROUND IS YOURS</div><h2>Know a great one?</h2><p>Share the venue, the details, and the drink that made it memorable.</p></div>
        <a className="marketing-button dark" href="/faq">How TopTini works <span>↗</span></a>
      </section>
    </main>
  );
}

function Feature({ number, title, text }) {
  return <article className="feature-row"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><b aria-hidden="true">↗</b></article>;
}

function EditorialPage({ page, info }) {
  return (
    <main className="editorial-main">
      <div className="editorial-hero"><a href="/" className="back-home">← BACK TO TOPTINI</a><p className="marketing-eyebrow"><span /> {info.eyebrow}</p><h1>{info.title}</h1><p className="marketing-lede">{info.intro}</p></div>
      <article className="editorial-content">
        {page === 'about' ? <AboutContent /> : null}
        {page === 'privacy' ? <PrivacyContent /> : null}
        {page === 'terms' ? <TermsContent /> : null}
        {page === 'faq' ? <FaqContent /> : null}
        {page === 'contact' ? <ContactContent /> : null}
      </article>
    </main>
  );
}

function AboutContent() {
  return <>
    <ContentSection title="A little more local, a lot more specific."><p>TopTini is a discovery guide built around one very particular drink. Browse participating city guides, see what the community thinks, and keep track of the places you want to try.</p><p>The first guides are focused on Milwaukee, Chicago, Phoenix, and Austin. Venue details may be marked as demo while the initial real-world listings are being verified.</p></ContentSection>
    <ContentSection title="Made for the whole experience."><p>From finding a neighborhood spot to adding a rating after the first sip, TopTini brings discovery, reviews, photos, favorites, and city rankings together.</p></ContentSection>
    <div className="editorial-note"><span>✳</span><p>Community scores reflect members’ experiences. Menus, hours, and availability can change, so confirm details with the venue before visiting.</p></div>
  </>;
}

function PrivacyContent() {
  return <>
    <p className="policy-date">Last updated November 10, 2026</p>
    <ContentSection title="Information you provide."><p>When you use TopTini, you may provide an email address for your account, a username, your preferred city, venue ratings and reviews, review photos, profile photos, favorites, and venue suggestions.</p></ContentSection>
    <ContentSection title="How information is used."><p>Account information is used to authenticate you and maintain your profile. Ratings, reviews, favorites, photos, and venue suggestions support the city guide, community rankings, and moderation.</p></ContentSection>
    <ContentSection title="What other people can see."><p>Published reviews, ratings, usernames, review dates, and attached drink photos can be visible to other TopTini users. Venue suggestions are reviewed before appearing in the guide. Profile images may also appear where your profile is shown.</p></ContentSection>
    <ContentSection title="Service providers."><p>TopTini uses Supabase for authentication, database storage, and photo storage. The marketing site loads its typefaces from Google Fonts. Those services receive the technical information needed to provide their services when your device connects to them.</p></ContentSection>
    <ContentSection title="Your choices and account deletion."><p>You can edit profile details and request account deletion from the Profile area in the app. You can edit or delete your own reviews and remove favorites. Deleting content may remove its related uploaded photo from the guide.</p></ContentSection>
    <ContentSection title="Contact."><p>For privacy questions or requests, contact the TopTini team at the support address listed on the <a href="/contact">Contact page</a>.</p></ContentSection>
  </>;
}

function TermsContent() {
  return <>
    <p className="policy-date">Last updated November 10, 2026</p>
    <ContentSection title="Using the guide."><p>TopTini helps people discover and discuss espresso martinis. You must be at least 21 years old to use the service in the United States and must follow local laws when visiting venues.</p></ContentSection>
    <ContentSection title="Ratings and community content."><p>Share honest ratings and reviews based on your own experience. Do not post unlawful, abusive, deceptive, threatening, or infringing content. Do not submit false venue details or manipulate scores.</p><p>You keep ownership of content you submit. By submitting it, you allow TopTini to display it as part of the guide and community features. TopTini may hide or remove content that violates these terms or is reported for review.</p></ContentSection>
    <ContentSection title="Venue suggestions and accuracy."><p>Venue suggestions are not published automatically. TopTini may verify, edit, decline, or remove a suggested listing. Menus, hours, prices, and availability can change; confirm current information directly with the venue.</p></ContentSection>
    <ContentSection title="Community scores."><p>Ratings and rankings represent community opinions. They are informational and are not a guarantee of quality, availability, or endorsement by a venue.</p></ContentSection>
    <ContentSection title="Account and changes."><p>You are responsible for keeping your account credentials secure. You may request account deletion in the app. These terms may be updated as TopTini changes; the date above indicates the latest revision.</p></ContentSection>
  </>;
}

function FaqContent() {
  return <div className="faq-list">{faqs.map((item, index) => <details className="faq-item" key={item.question} open={index === 0}><summary><span>{String(index + 1).padStart(2, '0')}</span>{item.question}<b>＋</b></summary><p>{item.answer}</p></details>)}<div className="editorial-note"><span>↗</span><p>Still have a question? Visit the <a href="/contact">Contact page</a>.</p></div></div>;
}

function ContactContent() {
  return <div className="contact-card"><div className="contact-icon">✉</div><div><div className="section-kicker">SUPPORT EMAIL</div><h2>We’d love to hear from you.</h2><p>For venue corrections, account questions, or general feedback, contact the TopTini team.</p><div className="contact-placeholder">Support email will be added here</div><p className="contact-note">The public support address is being finalized.</p></div></div>;
}

function ContentSection({ title, children }) {
  return <section className="content-section"><h2>{title}</h2>{children}</section>;
}

function NotFoundPage() {
  return <main className="editorial-main"><div className="editorial-hero"><p className="marketing-eyebrow"><span /> WRONG TURN</p><h1>This page isn’t on the menu.</h1><p className="marketing-lede">Head back to TopTini and find a city guide to explore.</p><a className="marketing-button dark" href="/">Back to TopTini <span>↗</span></a></div></main>;
}

function SiteFooter() {
  return <footer className="marketing-footer"><div className="footer-top"><a className="marketing-brand footer-brand" href="/"><img src="/brand/toptini-app-icon.png" alt="" /><span>TopTini</span></a><p>A city guide for the espresso martini curious.</p><a className="footer-admin" href="/admin">Admin sign in ↗</a></div><div className="footer-bottom"><span>© 2026 TopTini · Photography via Unsplash</span><nav aria-label="Legal and support"><a href="/about">About</a><a href="/privacy-policy">Privacy policy</a><a href="/terms-and-conditions">Terms</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></nav></div></footer>;
}
