/** GSAP registry — register plugins once, export configured instance. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Default ease
gsap.defaults({ ease: 'power3.out', duration: 0.6 });

export { gsap, ScrollTrigger, TextPlugin };
