import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';
import MarqueeBands from '@/components/MarqueeBands';
import HowItWorks from '@/components/HowItWorks';
import RewardsSection from '@/components/rewards/RewardsSection';
import FriendBento from '@/components/FriendBento';
import CommunityBoard from '@/components/CommunityBoard';
import FaqAccordion from '@/components/FaqAccordion';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

export default function Home() {
  return (
    <SmoothScroll>
      <div className="hero-pattern-wrapper">
        <Nav />
        <Hero />
      </div>

      <StatsBar />
      <MarqueeBands />
      <HowItWorks />
      <RewardsSection />
      <FriendBento />
      <CommunityBoard />
      <FaqAccordion />
      <Footer />
    </SmoothScroll>
  );
}
