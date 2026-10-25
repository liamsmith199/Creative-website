import {useEffect} from 'react';
import {Audience} from './components/Audience';
import {Contact} from './components/Contact';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {IceStage} from './components/IceStage';
import {Manifesto} from './components/Manifesto';
import {Process} from './components/Process';
import {Services} from './components/Services';
import {useReducedMotion} from './hooks/useReducedMotion';
import {startScroll} from './lib/scroll';

export default function App() {
  const reduced = useReducedMotion();

  useEffect(() => startScroll(reduced), [reduced]);

  return (
    <>
      <Header />
      <main>
        <IceStage />
        <Manifesto />
        <Services />
        <Process />
        <Audience />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
