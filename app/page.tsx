import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import HomeDiscovery from "../components/HomeDiscovery";
import HomeDreamInterpreter from "../components/HomeDreamInterpreter";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen overflow-x-clip bg-[#050b18]">
      <Header />
      <Hero />
      <HomeDreamInterpreter />
      <HomeDiscovery />
      <Footer />
    </main>
  );
}
