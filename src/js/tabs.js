(function($) {
    $(document).ready(function () {
        // Skrypt dla kliknięć w zakładki (tabsy)
        $('.tabs-container').each(function () {
            const $container = $(this);
          
            $container.find('> .tabs > .tab-link').on('click', function (event) {
              event.preventDefault();
              const tabId = $(this).data('tab'); // np. "tab1"
              if ($(this).hasClass('active')) {
                  return;
              }
              // Tylko lokalne tab-link i tab-content w bieżącym kontenerze
              const $localTabs = $container.find('> .tabs > .tab-link');
              const $localContents = $container.find('> .tab-content');
          
              // Usuwamy active z innych linków, dodajemy do klikniętego
              $localTabs.removeClass('active');
              $(this).addClass('active');
          
              // Znajdujemy aktualnie aktywny kontent
              const $currentActiveContent = $localContents.filter('.active');
              const $targetContent = $localContents.filter('#' + tabId);
                
              // Funkcja, która pokaże nowy tab
              function showNewTab() {
                $targetContent.fadeIn(300).addClass('active');
                // Przeskrolluj stronę do .tab-content
                $('html, body').animate({
                  scrollTop: $targetContent.offset().top
                }, 300);
              }
          
              // Jeśli istnieje aktywny content – chowamy go:
              if ($currentActiveContent.length) {
                $currentActiveContent.fadeOut(300, function() {
                  $(this).removeClass('active');
                  showNewTab();
                });
              } else {
                // Brak aktywnego kontentu => od razu pokazujemy nowy
                showNewTab();
              }
            });
        });
    
        // Obsługa hash zostaje BEZ ZMIAN
        function handleInitialHash() {
            const hash = window.location.hash;
            if (hash) {
                const [tabHash, accordionHash] = hash.split('#').filter(Boolean);
    
                // Jeśli jest hash dla tabsa, przełącz na odpowiednią zakładkę
                if (tabHash) {
                    const $targetTabLink = $(`.tabs .tab-link[data-tab="${tabHash}"]`);
                    if ($targetTabLink.length) {
                        $targetTabLink.trigger('click');
    
                        // Poczekaj na zakończenie animacji przełączania tabsa
                        setTimeout(() => {
                            // Następnie otwórz określony akordeon, jeśli jest zdefiniowany
                            if (accordionHash) {
                                const $targetAccordion = $(`#${accordionHash} .accordion-content`);
                                if ($targetAccordion.length) {
                                    $targetAccordion.closest(".accordion").find(".accordion-content").removeClass("open").slideUp();
                                    $targetAccordion.closest(".accordion").find(".accordion-item").removeClass("open");
    
                                    $targetAccordion.addClass("open").slideDown();
                                    $targetAccordion.closest(".accordion-item").addClass("open");
                                }
                            }
                        }, 400); // Dajemy opóźnienie, by poczekać na zakończenie przełączania tabsa
                    }
                }
            }
        }
    
        // Wywołaj obsługę hash na załadowanie strony tylko raz
        handleInitialHash();
    });
})(jQuery);

/* <div class=" tabs-container">
<div class="tabs">

    <a href="#" class="tab-link active" data-tab="tab-1"></a>

</div>

<div class="tab-content active" id="tab-1">
<p>Content for Tab 1.</p>
</div>
<div class="tab-content" id="tab-2">
<p>Content for Tab 2.</p>
</div>
<div class="tab-content" id="tab-3">
<p>Content for Tab 3.</p>
</div>
</div> */