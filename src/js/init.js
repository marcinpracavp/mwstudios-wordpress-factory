// Importy modułów Swiper
const { Navigation, Pagination, Autoplay } = window;

// Rejestracja modułów globalnie dla Swiper (tylko te dostępne)
if (window.Swiper) {
    const mods = [];
    if (window.SwiperNavigation) mods.push(window.SwiperNavigation);
    if (window.SwiperPagination) mods.push(window.SwiperPagination);
    if (window.SwiperAutoplay) mods.push(window.SwiperAutoplay);
    if (mods.length) window.Swiper.use(mods);
}



// var swiper = new Swiper(".specjalizacjeSwiper", {
//   grabCursor: false,
//   simulateTouch: false,
//   slidesPerView: 3,
//   spaceBetween: 16,
//   loop: true,
//   navigation: {
//       nextEl: ".specjalizacjeSwiper-next",
//       prevEl: ".specjalizacjeSwiper-prev",
//     },
// });


// $(function() {
//   $('.twentytwenty-init').twentytwenty({
//     orientation: 'vertical',
//     move_with_handle_only: true,
//   });
// })

