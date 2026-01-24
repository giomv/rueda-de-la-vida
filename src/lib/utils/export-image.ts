import { toPng, toJpeg } from 'html-to-image';

export async function exportToPng(element: HTMLElement, filename: string = 'rueda-de-la-vida') {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportToJpeg(element: HTMLElement, filename: string = 'rueda-de-la-vida') {
  const dataUrl = await toJpeg(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.download = `${filename}.jpg`;
  link.href = dataUrl;
  link.click();
}

export async function getImageDataUrl(element: HTMLElement): Promise<string> {
  return toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });
}
