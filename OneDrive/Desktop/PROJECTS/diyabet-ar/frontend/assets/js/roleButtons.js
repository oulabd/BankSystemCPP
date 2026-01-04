/**
 * Role Selection Buttons Module
 * Handles doctor and patient button interactions with video modals
 */

document.addEventListener('DOMContentLoaded', () => {
  const doctorBtn = document.getElementById('doctor-btn');
  const patientBtn = document.getElementById('patient-btn');

  if (!doctorBtn || !patientBtn) {
    console.warn('[RoleButtons] العناصر المطلوبة غير موجودة');
    return;
  }

  /**
   * Create and display a video modal
   */
  const openVideoModal = (videoSrc, title) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.style.display = 'flex';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'video-modal-content';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'video-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      modal.remove();
      document.body.style.overflow = '';
    });
    
    // Create video element
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.maxHeight = '80vh';
    video.style.borderRadius = '8px';
    
    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = 'video/mp4';
    video.appendChild(source);
    
    // Create title if provided
    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'video-modal-title';
      titleEl.textContent = title;
      titleEl.style.marginBottom = '16px';
      titleEl.style.color = '#333';
      modalContent.appendChild(titleEl);
    }
    
    // Assemble modal
    modalContent.appendChild(video);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    // Add modal styles if not already present
    if (!document.getElementById('role-video-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'role-video-modal-styles';
      style.textContent = `
        .video-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          animation: fadeIn 0.3s ease;
        }
        
        .video-modal-content {
          background: #fff;
          border-radius: 12px;
          padding: 32px;
          max-width: 900px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }
        
        .video-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 32px;
          color: #999;
          cursor: pointer;
          transition: color 0.3s ease;
          z-index: 1;
        }
        
        .video-modal-close:hover {
          color: #333;
        }
        
        .video-modal-title {
          font-size: 24px;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .video-modal-content {
            padding: 16px;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add to page and prevent body scroll
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        document.body.style.overflow = '';
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  /**
   * Handle doctor button click
   */
  const handleDoctorClick = (e) => {
    e.preventDefault();
    console.log('[RoleButtons] تم النقر على زر الطبيب');
    // Show the correct doktor.mp4 video
    openVideoModal('assets/media/طبيب.mp4', 'معلومات للطبيب');
  };

  /**
   * Handle patient button click
   */
  const handlePatientClick = (e) => {
    e.preventDefault();
    console.log('[RoleButtons] تم النقر على زر المريض');
    // Show the correct hasta.mp4 video
    openVideoModal('assets/media/سكري.mp4', 'معلومات للمريض');
  };

  // Event listeners
  doctorBtn.addEventListener('click', handleDoctorClick);
  patientBtn.addEventListener('click', handlePatientClick);

  console.log('[RoleButtons] تم تهيئة الوحدة بنجاح');
});
