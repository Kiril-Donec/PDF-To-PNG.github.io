document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const downloadAllButton = document.getElementById('downloadAll');
    const downloadSelectedButton = document.getElementById('downloadSelected');
    const pageInput = document.getElementById('pageInput');
    const pdfPreview = document.getElementById('pdfPreview');
    const pageSelection = document.getElementById('pageSelection');
    let pdf = null;

    pdfInput.addEventListener('change', async (e) => {
        const pdfFile = e.target.files[0];
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

        pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;

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

        downloadPages(1, pdf.numPages);
    });

    downloadSelectedButton.addEventListener('click', async () => {
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

        downloadPages(startPage, endPage);
    });

    async function downloadPages(start, end) {
        const zip = new JSZip();
        const folder = zip.folder('images');

        for (let i = start; i <= end; i++) {
            const page = await pdf.getPage(i);
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const context = canvas.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
            const imgData = canvas.toDataURL('image/png');
            const imgName = `page_${i}.png`;
            folder.file(imgName, imgData.split('base64,')[1], { base64: true });
        }

        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
                const zipUrl = URL.createObjectURL(blob);
                const zipLink = document.createElement('a');
                zipLink.href = zipUrl;
                zipLink.download = 'images.zip';
                zipLink.click();
            });
    }
});
