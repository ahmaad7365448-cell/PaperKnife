/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// pdfjs-dist v3 uses .js worker, v4+ uses .mjs
// Use CDN to avoid bundling issues on Vercel
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfMetaData {
  thumbnail: string
  pageCount: number
  isLocked: boolean
}

// Fixed cMapUrl for true offline usage (relative to base)
const getCMapUrl = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  return isCapacitor ? 'cmaps/' : '/PaperKnife/cmaps/';
};

/**
 * Universal file downloader that works on Web and Android
 */
export const downloadFile = async (data: Uint8Array | string, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      let base64Data = '';
      if (typeof data === 'string') {
        base64Data = data.includes(',') ? data.split(',')[1] : data;
      } else {
        const bytes = new Uint8Array(data);
        const chunks = [];
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          chunks.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize))));
        }
        base64Data = btoa(chunks.join(''));
      }

      let finalName = fileName;
      let counter = 1;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const extension = fileName.substring(fileName.lastIndexOf('.'));

      while (true) {
        try {
          await Filesystem.stat({
            path: finalName,
            directory: Directory.Documents
          });
          finalName = `${baseName} (${counter})${extension}`;
          counter++;
        } catch (e) {
          break;
        }
      }

      await Filesystem.writeFile({
        path: finalName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      
      return true;
    } catch (e) {
      console.error('Download error:', e);
      throw e;
    }
  } else {
    const blob = typeof data === 'string' 
      ? await (await fetch(data)).blob() 
      : new Blob([data as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
};

/**
 * Universal file sharer
 */
export const shareFile = async (data: Uint8Array | string, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      let base64Data = '';
      if (typeof data === 'string') {
        base64Data = data.includes(',') ? data.split(',')[1] : data;
      } else {
        const bytes = new Uint8Array(data);
        const chunks = [];
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          chunks.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize))));
        }
        base64Data = btoa(chunks.join(''));
      }

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      await Share.share({
        title: fileName,
        text: `Shared via PaperKnife`,
        url: result.uri,
        dialogTitle: 'Share PDF'
      });
      
      return true;
    } catch (e) {
      console.error('Share error:', e);
      throw e;
    }
  } else {
    const blob = typeof data === 'string' 
      ? await (await fetch(data)).blob() 
      : new Blob([data as BlobPart], { type: mimeType });
    
    const file = new File([blob], fileName, { type: mimeType });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'Shared via PaperKnife'
        });
        return true;
      } catch (e) {
        console.error('Web share failed, falling back to download');
      }
    }
    
    return downloadFile(data, fileName, mimeType);
  }
};

// Load the PDF Document once
export const loadPdfDocument = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
    });
    return await loadingTask.promise;
  } catch (error: any) {
    if (error.name === 'PasswordException') {
      throw error;
    }
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
      stopAtErrors: false,
    });
    return await loadingTask.promise;
  }
};

// Render a specific page from an already loaded PDF Document
export const renderPageThumbnail = async (pdf: any, pageNum: number, scale = 1.0, maxDpr = 2): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale });

    const maxDimension = 1200;
    const thumbnailScale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height);
    const dpr = window.devicePixelRatio || 1;
    const renderScale = scale * thumbnailScale * Math.min(dpr, maxDpr);
    const thumbViewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = thumbViewport.height;
    canvas.width = thumbViewport.width;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: context, viewport: thumbViewport, intent: 'print' }).promise;
    const dataUrl = canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/jpeg', 0.9);
    
    canvas.width = 0;
    canvas.height = 0;
    try { await page.cleanup(); } catch { /* ignore */ }
    return dataUrl;
  } catch (error) {
    console.error(`Error rendering page ${pageNum}:`, error);
    return '';
  }
};

// ULTRA-FAST: Render a small thumbnail for grids/lists
export const renderGridThumbnail = async (pdf: any, pageNum: number): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.5 });
    
    const maxDimension = 400;
    const thumbnailScale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height);
    const thumbViewport = page.getViewport({ scale: thumbnailScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) return '';
    
    canvas.height = thumbViewport.height;
    canvas.width = thumbViewport.width;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: context, viewport: thumbViewport, intent: 'display' }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    
    canvas.width = 0;
    canvas.height = 0;
    try { await page.cleanup(); } catch { /* ignore */ }
    return dataUrl;
  } catch (error) {
    return '';
  }
};

// Wrapper for backward compatibility
export const generateThumbnail = async (file: File, pageNum: number = 1): Promise<string> => {
  try {
    const pdf = await loadPdfDocument(file);
    const thumb = await renderPageThumbnail(pdf, pageNum, 0.8);
    try { await pdf.destroy(); } catch { /* ignore */ }
    return thumb;
  } catch (error) {
    console.error('Thumbnail error:', error);
    return '';
  }
};

export const destroyPdf = async (pdf: any) => {
  try { await pdf?.destroy(); } catch { /* ignore */ }
};

export const getPdfMetaData = async (file: File): Promise<PdfMetaData> => {
  const attempt = async (lenient: boolean): Promise<PdfMetaData> => {
    const loadingTask = pdfjsLib.getDocument({
      data: await file.arrayBuffer(),
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
      ...(lenient ? { stopAtErrors: false } : {}),
    });

    loadingTask.onPassword = () => { throw new Error('PASSWORD_REQUIRED'); };

    const pdf = await loadingTask.promise;
    const firstPageThumb = await renderPageThumbnail(pdf, 1);
    const pageCount = pdf.numPages;
    try { await pdf.destroy(); } catch { /* ignore */ }

    return {
      thumbnail: firstPageThumb,
      pageCount,
      isLocked: false
    };
  };
  try {
    return await attempt(false);
  } catch (error: any) {
    if (error.message === 'PASSWORD_REQUIRED' || error.name === 'PasswordException') {
      return { thumbnail: '', pageCount: 0, isLocked: true };
    }
    try {
      return await attempt(true);
    } catch {
      return { thumbnail: '', pageCount: 0, isLocked: false };
    }
  }
};

export const unlockPdf = async (file: File, password: string): Promise<PdfMetaData & { success: boolean, pdfDoc?: any }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password,
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const firstPageThumb = await renderPageThumbnail(pdf, 1);

    return {
      thumbnail: firstPageThumb,
      pageCount: pdf.numPages,
      isLocked: false,
      success: true,
      pdfDoc: pdf
    };
  } catch (error: any) {
    return {
      thumbnail: '',
      pageCount: 0,
      isLocked: true,
      success: false
    };
  }
};