document.addEventListener('DOMContentLoaded', async () => {
  const pdfInput = document.getElementById('pdfInput');
  const downloadAllButton = document.getElementById('downloadAll');
  const downloadSelectedButton = document.getElementById('downloadSelected');
  const pageInput = document.getElementById('pageInput');
  const pdfCanvas = document.getElementById('pdfCanvas');
  const pdfPrevPage = document.getElementById('pdfPrevPage');
  const pdfNextPage = document.getElementById('pdfNextPage');
  const pdfPageInfo = document.getElementById('pdfPageInfo');
  const pdfNavButtons = document.getElementById('pdfNavButtons');
  const statusMessage = document.getElementById('statusMessage');

  let pdf = null;
  let currentPage = 1;
  let isRendering = false;

  const enableDownloadButtons = () => {
    downloadAllButton.disabled = false;
    downloadSelectedButton.disabled = false;
  };

  const toggleDownloadSelectedButton = () => {
    downloadSelectedButton.style.display = pageInput.value.trim() ? 'inline-block' : 'none';
  };

  const scrollToStatus = () => {
    window.scrollTo(0, statusMessage.offsetTop);
  };

  const renderPage = async (pageNumber) => {
    if (!pdf || isRendering) return;
    isRendering = true;
    statusMessage.textContent = 'Загрузка';
    scrollToStatus();
    const page = await pdf.getPage(pageNumber);
    const scale = 1;
    const viewport = page.getViewport({ scale });
    const canvas = pdfCanvas;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    await page.render(renderContext).promise;
    pdfPageInfo.textContent = `Страница ${pageNumber} из ${pdf.numPages}`;
    currentPage = pageNumber;
    isRendering = false;
    statusMessage.textContent = '';
  };

  pdfInput.addEventListener('change', async (e) => {
    const pdfFile = e.target.files[0];
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

    pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;

    pdfNavButtons.style.display = 'flex';
    statusMessage.textContent = `Конвертация 1 из ${pdf.numPages}`;
    scrollToStatus();
    enableDownloadButtons();

    // Preload all pages to improve performance
    for (let i = 1; i <= pdf.numPages; i++) {
      await pdf.getPage(i);
    }

    renderPage(1);
  });

  pdfPrevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  });

  pdfNextPage.addEventListener('click', () => {
    if (currentPage < pdf.numPages) {
      renderPage(currentPage + 1);
    }
  });

  downloadAllButton.addEventListener('click', async () => {
    if (!pdf) {
      alert('Пожалуйста, сначала выберите файл PDF.');
      return;
    }

    window.scrollTo(0, 0);
    statusMessage.textContent = `Конвертация 1 из ${pdf.numPages}`;
    scrollToStatus();

    const zip = new JSZip();
    const folder = zip.folder('images');

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const scale = 1;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
      const imgData = canvas.toDataURL('image/png');
      const imgName = `page_${i}.png`;
      folder.file(imgName, imgData.split('base64,')[1], { base64: true });
      // Обновление статуса
      statusMessage.textContent = `Конвертация ${i} из ${pdf.numPages}`;
      scrollToStatus();
    }

    statusMessage.textContent = 'Архивация';
    scrollToStatus();

    zip.generateAsync({ type: 'blob' }, function updateCallback(metadata) {
      const percent = metadata.percent.toFixed(2);
      statusMessage.textContent = `Архивация ${percent}%`;
      scrollToStatus();
    })
    .then((blob) => {
      const zipUrl = URL.createObjectURL(blob);
      const zipLink = document.createElement('a');
      zipLink.href = zipUrl;
      zipLink.download = 'images.zip';
      zipLink.click();
      statusMessage.textContent = 'Загружено';
      scrollToStatus();
    });
  });

  downloadSelectedButton.addEventListener('click', async () => {
    if (!pdf) {
      alert('Пожалуйста, сначала выберите файл PDF.');
      return;
    }

    const pagesToDownloadInput = pageInput.value.trim();
    const pageRanges = pagesToDownloadInput.split(',');
    const zip = new JSZip();
    const folder = zip.folder('images');
    const totalPageCount = pdf.numPages;

    let processedPages = 0;
    let totalPagesToConvert = 0;

    for (const pageRange of pageRanges) {
      const rangeParts = pageRange.trim().split('-');
      if (rangeParts.length === 1) {
        const pageNumber = parseInt(rangeParts[0]);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPageCount) {
          totalPagesToConvert++;
        }
      } else if (rangeParts.length === 2) {
        const startPage = parseInt(rangeParts[0]);
        const endPage = parseInt(rangeParts[1]);
        if (!isNaN(startPage) && !isNaN(endPage) && startPage <= endPage && startPage >= 1 && endPage <= totalPageCount) {
          totalPagesToConvert += endPage - startPage + 1;
        }
      }
    }

    for (const pageRange of pageRanges) {
      const rangeParts = pageRange.trim().split('-');
      if (rangeParts.length === 1) {
        const pageNumber = parseInt(rangeParts[0]);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPageCount) {
          const page = await pdf.getPage(pageNumber);
          const scale = 1;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
          const imgData = canvas.toDataURL('image/png');
          const imgName = `page_${pageNumber}.png`;
          folder.file(imgName, imgData.split('base64,')[1], { base64: true });
          processedPages++;
          // Обновление статуса
          statusMessage.textContent = `Конвертация ${processedPages} из ${totalPagesToConvert}`;
          scrollToStatus();
        }
      } else if (rangeParts.length === 2) {
        const startPage = parseInt(rangeParts[0]);
        const endPage = parseInt(rangeParts[1]);
        if (!isNaN(startPage) && !isNaN(endPage) && startPage <= endPage && startPage >= 1 && endPage <= totalPageCount) {
          for (let i = startPage; i <= endPage; i++) {
            const page = await pdf.getPage(i);
            const scale = 1;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            await page.render(renderContext).promise;
            const imgData = canvas.toDataURL('image/png');
            const imgName = `page_${i}.png`;
            folder.file(imgName, imgData.split('base64,')[1], { base64: true });
            processedPages++;
            // Обновление статуса
            statusMessage.textContent = `Конвертация ${processedPages} из ${totalPagesToConvert}`;
            scrollToStatus();
          }
        }
      }
    }

    statusMessage.textContent = 'Архивация';
    scrollToStatus();

    zip.generateAsync({ type: 'blob' }, function updateCallback(metadata) {
      const percent = metadata.percent.toFixed(2);
      statusMessage.textContent = `Архивация ${percent}%`;
      scrollToStatus();
    })
    .then((blob) => {
      const zipUrl = URL.createObjectURL(blob);
      const zipLink = document.createElement('a');
      zipLink.href = zipUrl;
      zipLink.download = 'selected_images.zip';
      zipLink.click();
      statusMessage.textContent = 'Загружено';
      scrollToStatus();
    });
  });

  // Object with translations
  var translations = {
    'en': {
      'title': 'PDF to PNG Converter',
      'h1-title': 'PDF to PNG Converter',
      'downloadAll': 'Download All',
      'downloadSelected': 'Download Selected',
      'label-pageInput': 'Select pages to download (separate with commas, through dash):',
      'pageInfo': 'Page',
      'archiving': 'Archiving',
      'converting': 'Converting',
      'of': 'of',
      'convertedFromTotal': 'Converted from',
      'totalPages': 'total pages'
    },
    'ru': {
      'title': 'Конвертер PDF в PNG',
      'h1-title': 'Конвертер PDF в PNG',
      'downloadAll': 'Скачать все',
      'downloadSelected': 'Скачать выбранные',
      'label-pageInput': 'Выберите страницы для загрузки (разделите запятыми, через тире):',
      'pageInfo': 'Страница',
      'archiving': 'Архивация',
      'converting': 'Конвертация',
      'of': 'из',
      'convertedFromTotal': 'Конвертировано из',
      'totalPages': 'всего страниц'
    },
    'uk': {
      'title': 'Конвертер PDF у PNG',
      'h1-title': 'Конвертер PDF у PNG',
      'downloadAll': 'Завантажити все',
      'downloadSelected': 'Завантажити обрані',
      'label-pageInput': 'Виберіть сторінки для завантаження (розділіть комами, через тире):',
      'pageInfo': 'Сторінка',
      'archiving': 'Архівування',
      'converting': 'Конвертація',
      'of': 'з',
      'convertedFromTotal': 'Конвертовано з',
      'totalPages': 'всього сторінок'
    }
    // Add other languages here
  };

  // Choose language based on browser language or use default language
  var userLang = navigator.language || navigator.userLanguage;
  var languageFirstTwo = userLang.substr(0,2);
  
  // Use Ukrainian if it's available, otherwise use Russian as fallback
  var chosenLanguage = translations[languageFirstTwo] ? languageFirstTwo : 'ru';
  
  // Set interface language based on chosen language
  document.title = translations[chosenLanguage]['title'];
  document.getElementById('h1-title').innerText = translations[chosenLanguage]['h1-title'];
  document.getElementById('downloadAll').innerText = translations[chosenLanguage]['downloadAll'];
  document.getElementById('downloadSelected').innerText = translations[chosenLanguage]['downloadSelected'];
  document.getElementById('label-pageInput').innerText = translations[chosenLanguage]['label-pageInput'];
  document.getElementById('pdfPageInfo').innerText = translations[chosenLanguage]['pageInfo'];

  // Check if file is selected
  pdfInput.addEventListener('change', function() {
    var isFileSelected = !!this.files.length;
    document.getElementById('pdfCanvas').style.display = isFileSelected ? 'block' : 'none';
    document.getElementById('pdfNavButtons').style.display = isFileSelected ? 'flex' : 'none';
    document.getElementById('downloadAll').disabled = !isFileSelected;
    document.getElementById('downloadSelected').disabled = !isFileSelected;
    document.getElementById('pageSelection').style.display = isFileSelected ? 'block' : 'none';
  });

  // Update the display of the "Download Selected" button when the input changes
  pageInput.addEventListener('input', toggleDownloadSelectedButton);

  // Hide elements on page load
  window.onload = function() {
    document.getElementById('pdfCanvas').style.display = 'none';
    document.getElementById('pdfNavButtons').style.display = 'none';
    document.getElementById('downloadAll').disabled = true;
    document.getElementById('downloadSelected').disabled = true;
    document.getElementById('pageSelection').style.display = 'none';
  };
});
