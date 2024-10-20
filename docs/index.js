document.addEventListener('DOMContentLoaded', function() {
    fetch('./src_list.json')
        .then(response => response.json())
        .then(data => {
            const musicList = document.querySelector('ul.music-list');
            if (!musicList) {
                console.error('ul.music-list element not found');
                return;
            }
            data.forEach(item => {
                const li = document.createElement('li');
                li.setAttribute('ontouchstart', '');
                li.innerHTML = `${item.title}/${item.artist}`;
                if (item.url_date_sets) {
                    item.url_date_sets.forEach(set => {
                        const a = document.createElement('a');
                        a.href = set.url;
                        a.textContent = set.date;
                        li.appendChild(a);
                    });
                }
                musicList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching the JSON:', error));
});

