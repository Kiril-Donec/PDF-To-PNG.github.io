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
    const statusMessage = document.getElementById('statusMessage');
    let pdf = null;
    let currentPage = 1;
    let isRendering = false;

    const enableDownloadButtons = () => {
        downloadAllButton.disabled = false;
        downloadSelectedButton.disabled = false;
    };

    const scrollToStatus = () => {
        window.scrollTo(0, statusMessage.offsetTop);
    };

    const renderPage = async (pageNumber) => {
        if (!pdf || isRendering) return;
        isRendering = true;
        statusMessage.textContent = 'Завантаження';
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
        pdfPageInfo.textContent = `Сторінка ${pageNumber} з ${pdf.numPages}`;
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
        statusMessage.textContent = `Конвертація 1 з ${pdf.numPages}`;
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
            alert('Спершу виберіть PDF-файл.');
            return;
        }

        window.scrollTo(0, 0);
        statusMessage.textContent = 'Архівування 1 з 4'; // Замініть 4 на відповідне число сторінок
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
        }

        statusMessage.textContent = 'Завантаження';
        scrollToStatus();

        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
                const zipUrl = URL.createObjectURL(blob);
                const zipLink = document.createElement('a');
                zipLink.href = zipUrl;
                zipLink.download = 'images.zip';
                zipLink.click();
                statusMessage.textContent = 'Завантаження';
                scrollToStatus();
            });
    });

    downloadSelectedButton.addEventListener('click', async () => {
        if (!pdf) {
            alert('Спершу виберіть PDF-файл.');
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
                    statusMessage.textContent = `Архівування ${processedPages} з ${totalPagesToConvert}`;
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
                        statusMessage.textContent = `Архівування ${processedPages} з ${totalPagesToConvert}`;
                        scrollToStatus();
                    }
                }
            }
        }

        statusMessage.textContent = 'Завантаження';
        scrollToStatus();

        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
                const zipUrl = URL.createObjectURL(blob);
                const zipLink = document.createElement('a');
                zipLink.href = zipUrl;
                zipLink.download = 'selected_images.zip';
                zipLink.click();
                statusMessage.textContent = 'Завантаження';
                scrollToStatus();
            });
    });
});
