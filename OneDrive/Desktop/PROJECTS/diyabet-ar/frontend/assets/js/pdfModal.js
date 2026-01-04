/**
 * PDF Modal Module
 * Handles opening, closing, and managing the PDF documents modal
 */

document.addEventListener('DOMContentLoaded', () => {
  const pdfButton = document.getElementById('pdf-button');
  const pdfModal = document.getElementById('pdf-modal');
  const pdfModalClose = document.getElementById('pdf-modal-close');

  if (!pdfButton || !pdfModal) {
    console.warn('[PDFModal] العناصر المطلوبة غير موجودة');
    return;
  }

  /**
   * Opens the PDF modal
   */
  const openPDFModal = (e) => {
    e.preventDefault();
    pdfModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  /**
   * Closes the PDF modal
   */
  const closePDFModal = () => {
    pdfModal.style.display = 'none';
    document.body.style.overflow = '';
  };

  /**
   * Close modal when clicking outside the modal content
   */
  const handleModalBackdropClick = (e) => {
    if (e.target === pdfModal) {
      closePDFModal();
    }
  };

  // Event listeners
  pdfButton.addEventListener('click', openPDFModal);
  pdfModalClose.addEventListener('click', closePDFModal);
  pdfModal.addEventListener('click', handleModalBackdropClick);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pdfModal.style.display !== 'none') {
      closePDFModal();
    }
  });

  console.log('[PDFModal] تم بدء الوحدة بنجاح');
});
