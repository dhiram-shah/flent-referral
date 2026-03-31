'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { faqItems } from '@/lib/constants';
import ScrollReveal from './ScrollReveal';
import TypingText from './TypingText';

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const answerRefs = useRef<Map<number, { typed: boolean; abortId: ReturnType<typeof setTimeout> | null; aborted: boolean }>>(new Map());
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRefs = useRef<Map<number, ResizeObserver>>(new Map());

  const startObserving = useCallback((index: number) => {
    const wrapper = wrapperRefs.current[index];
    const content = contentRefs.current[index];
    if (!wrapper || !content) return;

    // Clean up previous observer
    observerRefs.current.get(index)?.disconnect();

    const ro = new ResizeObserver(() => {
      const h = content.scrollHeight;
      wrapper.style.height = h + 'px';
    });
    ro.observe(content);
    observerRefs.current.set(index, ro);
  }, []);

  const stopObserving = useCallback((index: number) => {
    observerRefs.current.get(index)?.disconnect();
    observerRefs.current.delete(index);
    const wrapper = wrapperRefs.current[index];
    if (wrapper) wrapper.style.height = '0px';
  }, []);

  const resetAnswer = useCallback((index: number) => {
    const data = answerRefs.current.get(index);
    if (data) {
      if (data.abortId) clearTimeout(data.abortId);
      data.aborted = true;
      data.typed = false;
    }
    stopObserving(index);
    const p = paragraphRefs.current[index];
    if (p) p.textContent = '';
  }, [stopObserving]);

  const typeAnswer = useCallback((index: number) => {
    let data = answerRefs.current.get(index);
    if (!data) {
      data = { typed: false, abortId: null, aborted: false };
      answerRefs.current.set(index, data);
    }
    if (data.typed) return;
    data.aborted = false;

    const p = paragraphRefs.current[index];
    if (!p) return;
    const text = faqItems[index].answer;
    const words = text.split(/\s+/);
    p.innerHTML = '';

    startObserving(index);

    const cursor = document.createElement('span');
    cursor.style.cssText = 'display:inline-block;width:2px;height:1em;background:rgba(255,255,255,0.85);margin-left:1px;vertical-align:text-bottom;animation:faq-blink 0.6s steps(1) infinite;';

    const pEl = p;
    let i = 0;
    function showNext() {
      if (data!.aborted) { cursor.remove(); return; }
      if (i < words.length) {
        const span = document.createElement('span');
        span.className = 'faq-word visible';
        span.textContent = words[i] + ' ';
        cursor.remove();
        pEl.appendChild(span);
        pEl.appendChild(cursor);
        i++;
        data!.abortId = setTimeout(showNext, 35);
      } else {
        cursor.remove();
        data!.typed = true;
      }
    }
    data.abortId = setTimeout(showNext, 80);
  }, [startObserving]);

  const handleToggle = useCallback((index: number) => {
    const isOpen = openIndex === index;

    if (openIndex !== null) {
      resetAnswer(openIndex);
    }

    if (isOpen) {
      setOpenIndex(null);
    } else {
      resetAnswer(index);
      setOpenIndex(index);
      setTimeout(() => typeAnswer(index), 150);
    }
  }, [openIndex, resetAnswer, typeAnswer]);

  // Cleanup observers on unmount
  useEffect(() => {
    return () => {
      observerRefs.current.forEach(ro => ro.disconnect());
    };
  }, []);

  return (
    <section className="faq">
      <div className="faq-inner">
        <div className="faq-left">
          <TypingText
            text="You got questions?"
            className="faq-heading"
            tag="h2"
            charDelay={0.018}
            startDelay={0.1}
          />
          <ScrollReveal delay={0.25}>
            <span className="faq-heading-italic">
              We got answers.
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.35}>
            <p className="faq-subtitle">Everything you need to know about the Flent Referral Program.</p>
          </ScrollReveal>
        </div>

        <ScrollReveal className="faq-right" delay={0.08}>
          <p className="faq-right-label">Common questions about referrals</p>
          <div className="faq-list">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                className={`faq-item${openIndex === i ? ' open' : ''}`}
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.035,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <button className="faq-button" onClick={() => handleToggle(i)}>
                  <span className="faq-question">{item.question}</span>
                  <motion.span
                    className="faq-toggle"
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
                  >
                    +
                  </motion.span>
                </button>
                <div className="faq-answer" ref={(el) => { wrapperRefs.current[i] = el; }}>
                  <div ref={(el) => { contentRefs.current[i] = el; }}>
                    <div className="faq-answer-card">
                      <p ref={(el) => { paragraphRefs.current[i] = el; }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </div>
      <ScrollReveal className="faq-footer-wrap">
        <motion.div
          className="faq-footer-card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <p className="faq-footer">Still have questions? <a href="mailto:sales@flent.in">Email us at sales@flent.in</a></p>
        </motion.div>
      </ScrollReveal>
    </section>
  );
}
