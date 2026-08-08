import Container from "../ui/Container";

const FOOTER_LINKS = [
  { name: "Docs", href: "#" },
  { name: "Github", href: "#" },
  { name: "Twitter", href: "#" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="footer-inner">
          <span>© {year} PromptForge</span>

          <div className="footer-links">
            {FOOTER_LINKS.map((link) => (
              <a key={link.name} href={link.href}>
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
