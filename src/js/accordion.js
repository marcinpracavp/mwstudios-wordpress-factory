(function($) {
    $(document).ready(function() {
        // Obsługa kliknięcia na nagłówki akordeonu
        $(".accordion-header").click(function(event) {
            event.preventDefault();
    
            const clickedHeader = $(this);
            // Znajdź najbliższy accordion-item dla klikniętego nagłówka
            const accordionItem = clickedHeader.closest(".accordion-item");
            const content = accordionItem.find(".accordion-content");
            const isOpen = content.hasClass("open");
            const accordion = accordionItem.closest(".accordion");
    
            // Zamknij wszystkie sekcje tylko w ramach tego akordeonu
            accordion.find(".accordion-content").removeClass("open").slideUp();
            accordion.find(".accordion-item").removeClass("open");
            // Zmieniamy ikonę przełącznika na '+' dla wszystkich nagłówków
            accordion.find(".toggle-icon").text('+');
    
            // Otwórz lub zamknij klikniętą sekcję i dodaj klasę do accordion-item
            if (!isOpen) {
                content.addClass("open").slideDown();
                accordionItem.addClass("open");
                // Zmieniamy ikonę przełącznika na '-' dla klikniętego nagłówka
                clickedHeader.find(".toggle-icon").text('-');
            }
        });
    
        // Otwieranie akordeonu na podstawie hash w URL
        const hash = window.location.hash;
        if (hash) {
            const targetContent = $(`${hash} .accordion-content`);
            if (targetContent.length) {
                const accordion = targetContent.closest(".accordion");
                // Zamknij wszystkie sekcje tylko w ramach docelowego akordeonu
                accordion.find(".accordion-content").removeClass("open").slideUp();
                accordion.find(".accordion-item").removeClass("open");
                // Resetuj wszystkie ikony na '+'
                accordion.find(".toggle-icon").text('+');
    
                // Otwórz docelową sekcję i dodaj klasę do accordion-item
                targetContent.addClass("open").slideDown();
                const targetItem = targetContent.closest(".accordion-item");
                targetItem.addClass("open");
                // Ustaw ikonę przełącznika na '-'
                targetItem.find(".accordion-header .toggle-icon").text('-');
            }
        }
    });
})(jQuery);

{/* <div class="accordion">
    <?php foreach($faq['faq'] as $item) : ?>
        <div class="accordion-item">
            <div class="accordion-header">
                <h3><?= $item['tytul'] ?></h3>
            </div>
            <div class="accordion-content">
                <p><?= $item['tresc'] ?></p>
            </div>
        </div>
    <?php endforeach; ?>
</div> */}