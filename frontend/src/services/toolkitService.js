import api from './api';

export const toolkitService = {
  /**
   * Convert document to PDF
   * @param {File} file - The file to convert
   * @returns {Promise<Blob>} - PDF file blob
   */
  async documentToPDF(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/toolkit/document-to-pdf/', formData, {
      responseType: 'blob',
    });
    
    return response.data;
  },

  /**
   * Convert multiple images to a single PDF
   * @param {File[]} files - Array of image files
   * @returns {Promise<Blob>} - Generated PDF blob
   */
  async imagesToPDF(files) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/toolkit/images-to-pdf/', formData, {
      responseType: 'blob',
    });

    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'images_to_pdf.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Add page numbers to PDF
   * @param {File} file - PDF file
   * @param {Object} options - Configuration options
   * @param {string} options.position - Page number position (e.g., 'bottom_right')
   * @param {number} options.font_size - Font size in points
   * @param {string} options.color - Hex color code (without #)
   * @param {number} options.start_number - Starting page number
   * @param {string} options.prefix - Prefix text
   * @param {string} options.suffix - Suffix text
   * @returns {Promise<Blob>} - PDF with page numbers
   */
  async addPageNumbers(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('position', options.position || 'bottom_right');
    formData.append('font_size', options.font_size || 10);
    formData.append('color', options.color || '000000');
    formData.append('start_number', options.start_number || 1);
    formData.append('prefix', options.prefix || '');
    formData.append('suffix', options.suffix || '');
    
    const response = await api.post('/toolkit/add-page-numbers/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `numbered_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Merge multiple PDFs into one
   * @param {File[]} files - Array of PDF files
   * @returns {Promise<Blob>} - Merged PDF file blob
   */
  async mergePDFs(files) {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post('/toolkit/merge-pdfs/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'merged.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Split/extract pages from PDF
   * @param {File} file - PDF file
   * @param {string} pages - Page range (e.g., "1-5,7,9-10")
   * @returns {Promise<Blob>} - Split PDF file blob
   */
  async splitPDF(file, pages) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages', pages);
    
    const response = await api.post('/toolkit/split-pdfs/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `split_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Lock PDF with password encryption
   * @param {File} file - PDF file
   * @param {string} password - Password to encrypt the PDF
   * @returns {Promise<Blob>} - Encrypted PDF file blob
   */
  async lockPDF(file, password) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    
    const response = await api.post('/toolkit/lock-pdf/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `locked_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Unlock password-protected PDF
   * @param {File} file - Encrypted PDF file
   * @param {string} password - Password to decrypt the PDF
   * @returns {Promise<Blob>} - Decrypted PDF file blob
   */
  async unlockPDF(file, password) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    
    const response = await api.post('/toolkit/unlock-pdf/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `unlocked_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Compress PDF file
   * @param {File} file - PDF file to compress
   * @param {string} compressionLevel - Compression level ('low', 'medium', 'high')
   * @returns {Promise<Blob>} - Compressed PDF file
   */
  async compressPDF(file, compressionLevel = 'medium') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compressionLevel', compressionLevel);
    
    const response = await api.post('/toolkit/compress-pdf/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `compressed_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Get supported file formats
   * @returns {Promise<Object>} - Supported formats and limits
   */
  async getSupportedFormats() {
    const response = await api.get('/toolkit/supported-formats/');
    return response.data;
  },

  /**
   * Add watermark to PDF
   * @param {File} file - PDF file
   * @param {Object} options - Watermark options
   * @returns {Promise<Blob>} - Watermarked PDF
   */
  async watermarkPDF(file, options) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('watermark_type', options.type || 'text');
    
    if (options.type === 'text') {
      formData.append('text', options.text || 'WATERMARK');
      formData.append('font_name', options.fontName || 'helvetica');
      formData.append('font_size', options.fontSize || 40);
      formData.append('color', options.color || '000000');
      formData.append('opacity', options.opacity || 0.3);
      formData.append('x_position', options.xPosition || 300);
      formData.append('y_position', options.yPosition || 400);
      formData.append('rotation', options.rotation || 45);
    } else if (options.type === 'image') {
      formData.append('watermark_image', options.image);
      formData.append('width', options.width || 200);
      formData.append('height', options.height || 200);
      formData.append('x_position', options.xPosition || 200);
      formData.append('y_position', options.yPosition || 300);
      formData.append('opacity', options.opacity || 0.3);
    }
    
    formData.append('apply_to_all', options.applyToAll ? 'true' : 'false');
    if (options.pageNumber) {
      formData.append('page_number', options.pageNumber);
    }
    
    const response = await api.post('/toolkit/watermark-pdf/', formData, {
      responseType: 'blob',
    });
    
    // Download the file
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `watermarked_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  /**
   * Edit PDF with annotations (text or highlights)
   * @param {File} file - PDF file
   * @param {Array} annotations - Annotation objects
   * @returns {Promise<Blob>} - Edited PDF
   */
  async editPDF(file, annotations) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('annotations', JSON.stringify(annotations || []));

    const response = await api.post('/toolkit/edit-pdf/', formData, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `edited_${file.name}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response.data;
  },
};

export default toolkitService;
