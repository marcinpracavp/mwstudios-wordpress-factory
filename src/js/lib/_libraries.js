// Import bibliotek i przypisanie do globalnego zakresu
import aoe from './aoe.js';
import Headroom from './headroom.js';
import Viewer from './viewer.js';
import { Swiper } from 'swiper';
import { Navigation } from 'swiper/modules';
import { Pagination } from 'swiper/modules';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './jquery.event.move.js';
import './jquery.twentytwenty.js';

// Eksportujemy biblioteki globalnie
if (typeof window !== 'undefined') {
  window.aoe = aoe;
  window.Headroom = Headroom;
  window.Viewer = Viewer;
  window.Swiper = Swiper;
  window.SwiperNavigation = Navigation;
  window.SwiperPagination = Pagination;
  window.SwiperAutoplay = Autoplay;
}

export { aoe, Headroom, Viewer, Swiper, Navigation, Pagination, Autoplay };
