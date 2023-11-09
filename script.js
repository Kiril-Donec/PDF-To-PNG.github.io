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

    const renderPage = async (pageNumber) => {
        if (!pdf) return;
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
        pdfPageInfo.textContent = `Сторінка ${pageNumber} з ${pdf.numPages}`;
        currentPage = pageNumber;
    };

    pdfInput.addEventListener('change', async (e) => {
        const pdfFile = e.target.files[0];
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

        pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;

        renderPage(1);

        pdfNavButtons.style.display = 'flex';
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
            alert('Спершу виберіть PDF-файл.');
            return;
        }

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
        const zip = new JSZip();
        const folder = zip.folder('images');

        for (const pageToDownload of pagesToDownload) {
            const pageNumber = parseInt(pageToDownload);
            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pdf.numPages) {
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
            }
        }

        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
                const zipUrl = URL.createObjectURL(blob);
                const zipLink = document.createElement('a');
                zipLink.href = zipUrl;
                zipLink.download = 'selected_images.zip';
                zipLink.click();
            });
    });
});
