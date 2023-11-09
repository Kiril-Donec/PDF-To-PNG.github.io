document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const downloadAllButton = document.getElementById('downloadAll');
    const pageInput = document.getElementById('pageInput');
    const loadPageButton = document.getElementById('loadPage');
    const pdfPreview = document.getElementById('pdfPreview');
    const pageInfo = document.getElementById('pageInfo');
    let pdf = null;
    let currentPage = 1;

    async function renderPage(pageNumber) {
        if (pdf) {
            const page = await pdf.getPage(pageNumber);
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
            pdfPreview.innerHTML = '';
            pdfPreview.appendChild(canvas);
            pageInfo.textContent = `Сторінка ${pageNumber} з ${pdf.numPages}`;
        }
    }

    pdfInput.addEventListener('change', async (e) => {
        const pdfFile = e.target.files[0];
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

        pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
        currentPage = 1;
        await renderPage(currentPage);
    });

    loadPageButton.addEventListener('click', () => {
        const pageNumber = parseInt(pageInput.value);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pdf.numPages) {
            currentPage = pageNumber;
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
});
