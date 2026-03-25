export default function Footer({ data }) {
  return (
    <footer className="resultados-footer">
      <div className="resultados-footer-main">
        <div className="resultados-footer-brand">
          <span>{data.brand}</span>
          <p>{data.description}</p>
        </div>

        <div className="resultados-footer-col">
          <h4>Quick Links</h4>
          <div>
            {data.quickLinks.map((item) => (
              <a key={item} href="#">
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="resultados-footer-col">
          <h4>Legal</h4>
          <div>
            {data.legal.map((item) => (
              <a key={item} href="#">
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="resultados-footer-col">
          <h4>Newsletter</h4>
          <p>{data.newsletterLabel}</p>
          <div className="resultados-footer-newsletter">
            <input placeholder="Email Address" type="email" />
            <button type="button">→</button>
          </div>
        </div>
      </div>

      <div className="resultados-footer-bottom">
        <p>{data.copyright}</p>
      </div>
    </footer>
  );
}
