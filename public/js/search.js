'use strict';

window.addEventListener('load', function () {
  const eventContainers = document.querySelectorAll('.event_container');
  eventContainers.forEach(function (eventContainer, index) {
    eventContainer.setAttribute('data-original-order', index);
  });
});

// Aggiungi un event listener al documento per gestire i clic sugli elementi del menu a discesa
document.addEventListener('click', function (event) {
  const target = event.target;

  // Controlla quale elemento è stato cliccato e chiama la funzione corrispondente
  if (target.id === 'showAllEvents') {
    showAllEvents();
  } else if (target.id === 'filterConcerto') {
    filterEvents('Concerto');
  } else if (target.id === 'filterCinema') {
    filterEvents('Cinema');
  } else if (target.id === 'filterSerata') {
    filterEvents('Serata');
  } else if (target.id === 'filterTeatro') {
    filterEvents('Teatro');
  }
});

function showAllEvents() {
  const allEventsDiv = document.querySelector('#show_events');
  const eventContainers = Array.from(document.querySelectorAll('.event_container'));

  // Rimuovi tutti gli eventi attualmente visualizzati
  allEventsDiv.innerHTML = '';

  eventContainers.forEach(function (eventContainer) {
    eventContainer.style.display = 'block';
  });

  // Ordina gli eventi in base all'attributo data-original-order
  const sortedEventContainers = eventContainers.sort(function (a, b) {
    const orderA = parseInt(a.getAttribute('data-original-order'));
    const orderB = parseInt(b.getAttribute('data-original-order'));
    return orderA - orderB;
  });

  sortedEventContainers.forEach(function (eventContainer) {
    eventContainer.classList.add('col-12', 'col-md-6', 'mx-auto', 'mb-2', 'mb-3', 'event_mod');
    allEventsDiv.appendChild(eventContainer); // Aggiungi l'evento al documento nell'ordine iniziale
  });
}



function filterEvents(category) {
  const eventContainers = document.querySelectorAll('.event_container');
  const visibleEventContainers = [];
  const hiddenEventContainers = [];

  eventContainers.forEach(function (eventContainer) {
    const categoryFilter = eventContainer.getAttribute('data-category');
    if (category === categoryFilter) {
      eventContainer.style.display = 'block';
      visibleEventContainers.push(eventContainer);
    } else {
      eventContainer.style.display = 'none';
      hiddenEventContainers.push(eventContainer);
    }
  });

  // Concatena gli array visibili e nascosti in un unico array
  const reorderedEventContainers = visibleEventContainers.concat(hiddenEventContainers);

  // Aggiorna l'ordine degli eventi nel documento e ripristina le classi Bootstrap
  const allEventsDiv = document.querySelector('#show_events');
  allEventsDiv.innerHTML = '';

  reorderedEventContainers.forEach(function (eventContainer) {
    // Aggiungi le classi Bootstrap per le colonne
    eventContainer.classList.add('col-12', 'col-md-6', 'mx-auto', 'mb-2', 'mb-3', 'event_mod');
    allEventsDiv.appendChild(eventContainer);
  });
}


