document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const downloadAllButton = document.getElementById('downloadAll');
    const pageInput = document.getElementById('pageInput');
    const pdfPreview = document.getElementById('pdfPreview');
    const pageSelection = document.getElementById('pageSelection');

    let pdf = null;

    pdfInput.addEventListener('change', async (e) => {
        const pdfFile = e.target.files[0];
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

        pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;

        // Додайте код для відображення першої сторінки PDF у pdfPreview
        const firstPage = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = firstPage.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await firstPage.render(renderContext).promise;
        pdfPreview.innerHTML = '';
        pdfPreview.appendChild(canvas);

        // Додайте код для відображення кількості сторінок у pageSelection
        const numPages = pdf.numPages;
        const pagesLabel = document.createElement('label');
        pagesLabel.textContent = `Виберіть сторінки для завантаження (1-${numPages}):`;
        pageSelection.insertBefore(pagesLabel, pageInput);
        pageInput.placeholder = `1-${numPages}`;
    });

    downloadAllButton.addEventListener('click', async () => {
        if (!pdf) {
            alert('Спершу виберіть PDF-файл.');
            return;
        }

        const pagesToDownload = pageInput.value.split('-');
        if (pagesToDownload.length !== 2) {
            alert('Неправильний формат введення сторінок.');
            return;
        }

        const startPage = parseInt(pagesToDownload[0]);
        const endPage = parseInt(pagesToDownload[1]);

        if (isNaN(startPage) || isNaN(endPage) || startPage < 1 || endPage < 1 || startPage > endPage || endPage > pdf.numPages) {
            alert('Неправильний діапазон сторінок.');
            return;
        }

        // Додайте код для конвертації вибраних сторінок у зображення PNG
    });
});
