import Navbar from "../../components/layout/Navbar";
import Hero from "./Hero.jsx";
import WorkspaceSection from "./WorkspaceSection.jsx";
import CompareSection from "./CompareSection.jsx";
import AnalyticsSection from "./AnalyticsSection.jsx";
import CTASection from "./CTASection.jsx";
import Footer from "../../components/layout/Footer.jsx";

const Landing = () => {
  return (
    <>
      <Navbar />

      <Hero />

      <WorkspaceSection />

      <CompareSection />

      <AnalyticsSection />

      <CTASection />

      <Footer />
    </>
  );
};

export default Landing;