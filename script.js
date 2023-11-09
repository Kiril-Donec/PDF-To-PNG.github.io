document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const downloadAllButton = document.getElementById('downloadAll');
    const downloadSelectedButton = document.getElementById('downloadSelected');
    const pageInput = document.getElementById('pageInput');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfPrevPage = document.getElementById('pdfPrevPage');
    const pdfNextPage = document.getElementById('pdfNextPage');
    const pdfPageInfo = document.getElementById('pdfPageInfo');
    const pdfNavButtons = document.getElementById('pdfNavButtons');
    let pdf = null;
    let currentPage = 1;

    pdfInput.addEventListener('change', async (e) => {
        const pdfFile = e.target.files[0];
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

        pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
        pdfNavButtons.style.display = 'flex';
        updatePageInfo();

        renderPage(currentPage);
    });

    pdfPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });

    pdfNextPage.addEventListener('click', () => {
        if (currentPage < pdf.numPages) {
            currentPage++;
            renderPage(currentPage);
        }
    });

    downloadAllButton.addEventListener('click', async () => {
        if (!pdf) {
            alert('Спершу виберіть PDF-файл.');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('images');

        for (let i = 1; i <= pdf.numPages; i++) {
            renderPage(i); // Render the page before downloading
            const page = await pdf.getPage(i);
            const scale = 1.5;
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
        }

        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
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

        const pagesToDownload = pageInput.value.split(',');
        const invalidPages = pagesToDownload.some((page) => {
            const pageNumber = parseInt(page);
            return isNaN(pageNumber) || pageNumber < 1 || pageNumber > pdf.numPages;
        });

        if (invalidPages) {
            alert('Неправильний формат введення сторінок.');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('images');

        for (const page of pagesToDownload) {
            const pageNumber = parseInt(page);
            renderPage(pageNumber); // Render the page before downloading
            const page = await pdf.getPage(pageNumber);
            const scale = 1.5;
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
        }

        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
                const zipUrl = URL.createObjectURL(blob);
                const zipLink = document.createElement('a');
                zipLink.href = zipUrl;
                zipLink.download = 'images.zip';
                zipLink.click();
            });
    });

    function renderPage(pageNumber) {
        pdf.getPage(pageNumber).then((page) => {
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            const context = pdfCanvas.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            pdfPageInfo.textContent = `Сторінка ${pageNumber} з ${pdf.numPages}`;
            page.render(renderContext).promise;
        });
    }

    function updatePageInfo() {
        pdfPageInfo.textContent = `Сторінка ${currentPage} з ${pdf.numPages}`;
    }
});
