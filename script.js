document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const downloadAllButton = document.getElementById('downloadAll');
    const downloadSelectedButton = document.getElementById('downloadSelected');
    const pageInput = document.getElementById('pageInput');
    const pdfContainer = document.getElementById('pdfContainer');
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfPrevPage = document.getElementById('pdfPrevPage');
    const pdfNextPage = document.getElementById('pdfNextPage');
    const pdfPageCounter = document.getElementById('pdfPageCounter');
    const pdfCanvas = document.getElementById('pdfCanvas');
    let pdf = null;
    let currentPage = 1;

    pdfInput.addEventListener('change', async (e) => {
        const pdfFile = e.target.files[0];
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

        pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
        renderPage(currentPage);
    });

    async function renderPage(pageNumber) {
        if (!pdf) return;

        const page = await pdf.getPage(pageNumber);
        const scale = 0.5; // Зменшуємо масштаб до 50%
        const viewport = page.getViewport({ scale });
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        const canvasContext = pdfCanvas.getContext('2d');
        const renderContext = {
            canvasContext,
            viewport,
        };
        await page.render(renderContext).promise;
        pdfPageCounter.textContent = `Сторінка ${pageNumber} з ${pdf.numPages}`;
        currentPage = pageNumber;
    }

    downloadAllButton.addEventListener('click', async () => {
        if (!pdf) {
            alert('Спершу виберіть PDF-файл.');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('images');

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const scale = 0.5; // Зменшуємо масштаб до 50%
            const viewport = page.getViewport({ scale });
            pdfCanvas.width = viewport.width;
            pdfCanvas.height = viewport.height;
            const canvasContext = pdfCanvas.getContext('2d');
            const renderContext = {
                canvasContext,
                viewport,
            };
            await page.render(renderContext).promise;
            const imgData = pdfCanvas.toDataURL('image/png');
            const imgName = `page_${i}.png`;
            folder.file(imgName, imgData.split('base64,')[1], { base64: true });
        }

        zip.generateAsync({ type: 'blob' }).then((blob) => {
            const zipUrl = URL.createObjectURL(blob);
            const zipLink = document.createElement('a');
            zipLink.href = zipUrl;
            zipLink.download = 'images.zip';
            zipLink.click();
        });
    });

    downloadSelectedButton.addEventListener('click', async () => {
        if (!pdf) {
            alert('Спершу виберіть PDF-файл.');
            return;
        }

        const pagesToDownload = pageInput.value.split(',').map(page => page.trim()).map(Number);
        const invalidPages = pagesToDownload.filter(page => isNaN(page) || page < 1 || page > pdf.numPages);

        if (invalidPages.length > 0) {
            alert('Неправильний формат введення сторінок.');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('images');

        for (const pageNumber of pagesToDownload) {
            const page = await pdf.getPage(pageNumber);
            const scale = 0.5; // Зменшуємо масштаб до 50%
            const viewport = page.getViewport({ scale });
            pdfCanvas.width = viewport.width;
            pdfCanvas.height = viewport.height;
            const canvasContext = pdfCanvas.getContext('2d');
            const renderContext = {
                canvasContext,
                viewport,
            };
            await page.render(renderContext).promise;
            const imgData = pdfCanvas.toDataURL('image/png');
            const imgName = `page_${pageNumber}.png`;
            folder.file(imgName, imgData.split('base64,')[1], { base64: true });
        }

        zip.generateAsync({ type: 'blob' }).then((blob) => {
            const zipUrl = URL.createObjectURL(blob);
            const zipLink = document.createElement('a');
            zipLink.href = zipUrl;
            zipLink.download = 'images.zip';
            zipLink.click();
        });
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
});
