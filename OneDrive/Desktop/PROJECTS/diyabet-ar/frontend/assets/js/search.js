
// Search functionality for all pages
class PageSearch {
  constructor() {
    this.searchTimeout = null; 
    this.searchModal = null;
    this.searchInput = null;
    this.highlightedElements = [];
    this.currentIndex = 0;
    this.init();
  }

  init() {
    // Create search modal if it doesn't exist
    if (!document.getElementById('search-modal')) {
      this.createSearchModal();
    }
    
    this.searchModal = document.getElementById('search-modal');
    this.searchInput = document.getElementById('search-input');
    
    // Attach event listeners
    this.attachListeners();
  }

  createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'search-modal';
    modal.innerHTML = `
      <div class="search-modal-content">
        <div class="search-modal-header">
          <input 
            type="text" 
            id="search-input" 
            class="search-input" 
            placeholder="ابحث في الصفحة..."
            aria-label="ابحث في الصفحة"
          >
          <button id="close-search" class="search-close-btn" aria-label="إغلاق البحث">✕</button>
        </div>
        <div class="search-results">
          <div id="search-status" class="search-status">جاهز للبحث...</div>
          <div class="search-controls">
            <button id="prev-result" class="search-nav-btn" aria-label="النتيجة السابقة">السابق ←</button>
            <span id="result-count" class="result-count">0 / 0</span>
            <button id="next-result" class="search-nav-btn" aria-label="النتيجة التالية">التالي →</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  attachListeners() {
    const searchBtns = Array.from(document.querySelectorAll('.search-btn'));
    const closeBtn = document.getElementById('close-search');
    const prevBtn = document.getElementById('prev-result');
    const nextBtn = document.getElementById('next-result');
    
    searchBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.openSearch());
    });
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSearch());
    }
    
    if (this.searchInput) {
      // Keep overlay open while typing; only close on Enter
      this.searchInput.addEventListener('input', (e) => this.performSearch(e.target.value, { closeOnFirst: false }));
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.searchInput.value, { closeOnFirst: true });
        } else if (e.key === 'Escape') {
          this.closeSearch();
        }
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevResult());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextResult());
    }
    
    // Close modal when clicking outside
    this.searchModal.addEventListener('click', (e) => {
      if (e.target === this.searchModal) {
        this.closeSearch();
      }
    });
  }

  openSearch() {
    if (this.searchModal) {
      this.searchModal.classList.add('active');
      this.searchInput.focus();
      this.searchInput.value = '';
      this.clearHighlights();
      this.currentIndex = 0;
      document.getElementById('search-status').textContent = 'جاهز للبحث...';
      document.getElementById('result-count').textContent = '0 / 0';
    }
  }

  closeSearch() {
    if (this.searchModal) {
      this.searchModal.classList.remove('active');
      this.clearHighlights();
      this.currentIndex = 0;
    }
  }

  performSearch(query, opts = { closeOnFirst: false }) {
    this.clearHighlights();
    this.currentIndex = 0;

    if (!query.trim()) {
      document.getElementById('search-status').textContent = 'جاهز للبحث...';
      document.getElementById('result-count').textContent = '0 / 0';
      return;
    }

    // Only search chat messages on chat page
    let searchRoot = document.body;
    if (window.location.pathname.includes('chat.html')) {
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages) searchRoot = chatMessages;
    } else if (window.location.pathname.includes('personal-settings.html')) {
      // Search only in the main content card on personal-settings page
      const formCard = document.querySelector('.form-card');
      const titleCard = document.querySelector('.title-card');
      if (formCard && titleCard) {
        // Create a temporary wrapper to search both
        const wrapper = document.createElement('div');
        wrapper.appendChild(titleCard.cloneNode(true));
        wrapper.appendChild(formCard.cloneNode(true));
        searchRoot = wrapper;
      } else if (formCard) {
        searchRoot = formCard;
      }
    }

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.clearHighlights();
      const count = this.highlightMatches(searchRoot, query);
      if (count === 0) {
        document.getElementById('search-status').textContent = `لا توجد نتائج لـ "${query}"`;
        document.getElementById('result-count').textContent = '0 / 0';
        return;
      }
      document.getElementById('search-status').textContent = `تم العثور على ${count} نتيجة`;
      document.getElementById('result-count').textContent = `1 / ${count}`;
      this.scrollToResult(0, { closeModal: false, flash: true });
    }, 80);
  }

  highlightMatches(node, query) {
  const term = query.trim();
  if (!term) return 0;

  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const normalize = (str) =>
    str.normalize('NFKD').toLocaleLowerCase('ar');

  const searchTerm = normalize(term);

  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (textNode) => {
        const p = textNode.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;

        const skip = new Set([
          'SCRIPT','STYLE','NOSCRIPT','IFRAME',
          'TEXTAREA','INPUT','SELECT','OPTION'
        ]);
        if (skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest('#search-modal')) return NodeFilter.FILTER_REJECT;

        return textNode.nodeValue && textNode.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    },
    false
  );

  let nodeText;
  const matches = [];

  while ((nodeText = walker.nextNode())) {
    const original = nodeText.nodeValue;
    const normalizedText = normalize(original);

    let idx = 0;
    while ((idx = normalizedText.indexOf(searchTerm, idx)) !== -1) {
      matches.push({
        textNode: nodeText,
        start: idx,
        len: term.length,
        original
      });
      idx += term.length;
    }
  }

  matches.forEach(({ textNode, start, len, original }) => {
    const span = document.createElement("span");

    let html = '';
    html += escapeHtml(original.slice(0, start));
    html += `<mark class="search-highlight">`
          + escapeHtml(original.slice(start, start + len))
          + `</mark>`;
    html += escapeHtml(original.slice(start + len));

    span.innerHTML = html;
    textNode.parentNode.replaceChild(span, textNode);
  });

  this.highlightedElements = Array.from(
    document.querySelectorAll('.search-highlight')
  );

  console.log('[PageSearch] matches:', this.highlightedElements.length);

  return this.highlightedElements.length;
}




  nextResult() {
    if (this.highlightedElements.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.highlightedElements.length;
    this.scrollToResult(this.currentIndex);
    document.getElementById('result-count').textContent = `${this.currentIndex + 1} / ${this.highlightedElements.length}`;
  }

  prevResult() {
    if (this.highlightedElements.length === 0) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.highlightedElements.length) % this.highlightedElements.length;
    this.scrollToResult(this.currentIndex);
    document.getElementById('result-count').textContent = `${this.currentIndex + 1} / ${this.highlightedElements.length}`;
  }

  scrollToResult(index, opts = { flash: true, closeModal: false }) {
    if (this.highlightedElements[index]) {
      const element = this.highlightedElements[index];
      
      // Remove previous active state
      document.querySelectorAll('.search-highlight.active').forEach(el => {
        el.classList.remove('active');
      });
      
      // Add active state to current
      element.classList.add('active');
      
      // Scroll into view (centered) and optionally flash
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (opts.flash) {
          element.classList.add('flash');
          setTimeout(() => element.classList.remove('flash'), 800);
        }
      });

      // Optionally close the modal so the user sees the context
      if (opts.closeModal && this.searchModal) {
        this.searchModal.classList.remove('active');
      }
    }
  }

 clearHighlights() {
  const marked = document.querySelectorAll('.search-highlight');

  marked.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;

    const text = document.createTextNode(mark.textContent);

    parent.replaceChild(text, mark);
    parent.normalize();
  });

  this.highlightedElements = [];
}


}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pageSearch = new PageSearch();
  });
} else {
  window.pageSearch = new PageSearch();
}
