'use strict';

const searchTypeSelect = document.getElementById('genereRicerca');
const searchInput = document.querySelector(".form-control[type='text']");

if(searchTypeSelect != null)
{
    searchTypeSelect.addEventListener('change', function () {
        const selectedValue = searchTypeSelect.value;
            
        switch (selectedValue) {
            case 'name':
                searchInput.type = 'text';
                searchInput.placeholder = 'Inserisci un nome...';
                break;
            case 'date':
                searchInput.type = 'date';
                searchInput.placeholder = 'Inserisci una data...';
                break;
            case 'location':
                searchInput.type = 'text';
                searchInput.placeholder = 'Inserisci un locale...';
                break;
            default:
                searchInput.type = 'text';
                searchInput.placeholder = 'Inserisci un nome...';
            }
        });
}
