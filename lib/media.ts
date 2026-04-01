import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';
import { getHelpMediaDir } from './media-dir';

/** Notion image URL patterns (expiring S3 and similar) */
const NOTION_IMAGE_URL_PATTERNS = [
  /^https:\/\/prod-files-secure\.s3\.[^.]+\.amazonaws\.com\//,
  /^https:\/\/[^/]*\.s3\.[^/]*\.amazonaws\.com\/.*notion/,
  /^https:\/\/www\.notion\.so\//,
  /^https:\/\/images\.unsplash\.com\/.*\?.*notion/,
];

function isNotionImageUrl(url: string): boolean {
  try {
    new URL(url);
    return NOTION_IMAGE_URL_PATTERNS.some((p) => p.test(url));
  } catch {
    return false;
  }
}

/**
 * Generate a stable filename for a Notion URL (uses path without query for cache efficiency)
 */
function getFilenameForNotionUrl(url: string): string {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || 'image';
  const ext = path.extname(lastSegment) || '.jpg';
  // Use file UUID (second-to-last segment) + extension for stability across syncs
  const fileId = pathSegments.length >= 2 ? pathSegments[pathSegments.length - 2] : null;
  const baseName = path.basename(lastSegment, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeName = `${fileId || crypto.createHash('md5').update(url).digest('hex').slice(0, 12)}-${baseName}${ext}`;
  return safeName.slice(0, 200);
}

/**
 * Ensure media directory exists
 */
export function ensureMediaDir(): void {
  const dir = getHelpMediaDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Download a file from URL and save to local media directory
 */
export async function downloadMedia(
  url: string,
  filename: string,
  options?: { overwrite?: boolean },
): Promise<string> {
  ensureMediaDir();

  const filePath = path.join(getHelpMediaDir(), filename);

  if (fs.existsSync(filePath)) {
    if (!options?.overwrite) {
      return `/media/${filename}`;
    }
    fs.unlinkSync(filePath);
  }

  return new Promise((resolve, reject) => {
    const doRequest = (targetUrl: string) => {
      const protocol = new URL(targetUrl).protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(filePath);

      protocol
        .get(
          targetUrl,
          {
            headers: {
              'User-Agent':
                process.env.HELP_CENTER_HTTP_USER_AGENT || 'NotionHelpCenter-ImageSync/1.0',
            },
          },
          (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const location = response.headers.location;
            if (location) {
              file.close();
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              return doRequest(location);
            }
          }
          if (response.statusCode !== 200) {
            file.close();
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            reject(new Error(`Failed to download: ${response.statusCode}`));
            return;
          }

          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve(`/media/${filename}`);
          });
        })
        .on('error', (err) => {
          file.close();
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          reject(err);
        });
    };

    doRequest(url);
  });
}

/**
 * Extract filename from URL
 */
export function getFilenameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const { pathname } = urlObj;
  const filename = path.basename(pathname);
  
  // Add extension if missing
  if (!filename.includes('.')) {
    return `${filename}.jpg`;
  }
  
  return filename;
}

/**
 * Process Notion block and download any media
 */
export async function processBlockMedia(block: any): Promise<any> {
  if (!block || typeof block !== 'object') {
    return block;
  }

  const processedBlock = { ...block };

  // Handle image blocks
  if (block.type === 'image' && block.image) {
    const imageUrl =
      block.image.type === 'external'
        ? block.image.external.url
        : block.image.file?.url;

    if (imageUrl) {
      try {
        const filename = getFilenameFromUrl(imageUrl);
        const localUrl = await downloadMedia(imageUrl, filename);
        processedBlock.image = {
          ...block.image,
          localUrl,
          originalUrl: imageUrl,
        };
      } catch (error) {
        console.error(`Failed to download image ${imageUrl}:`, error);
        // Keep original URL as fallback
      }
    }
  }

  // Handle video blocks
  if (block.type === 'video' && block.video) {
    const videoUrl =
      block.video.type === 'external'
        ? block.video.external.url
        : block.video.file?.url;

    if (videoUrl) {
      try {
        const filename = getFilenameFromUrl(videoUrl);
        const localUrl = await downloadMedia(videoUrl, filename);
        processedBlock.video = {
          ...block.video,
          localUrl,
          originalUrl: videoUrl,
        };
      } catch (error) {
        console.error(`Failed to download video ${videoUrl}:`, error);
        // Keep original URL as fallback
      }
    }
  }

  // Handle file blocks
  if (block.type === 'file' && block.file) {
    const fileUrl =
      block.file.type === 'external'
        ? block.file.external.url
        : block.file.file?.url;

    if (fileUrl) {
      try {
        const filename = getFilenameFromUrl(fileUrl);
        const localUrl = await downloadMedia(fileUrl, filename);
        processedBlock.file = {
          ...block.file,
          localUrl,
          originalUrl: fileUrl,
        };
      } catch (error) {
        console.error(`Failed to download file ${fileUrl}:`, error);
        // Keep original URL as fallback
      }
    }
  }

  // Recursively process children
  if (block.children && Array.isArray(block.children)) {
    processedBlock.children = await Promise.all(
      block.children.map((child: any) => processBlockMedia(child)),
    );
  }

  return processedBlock;
}

/**
 * Process all blocks in an array and download media
 */
export async function processBlocksMedia(blocks: any[]): Promise<any[]> {
  return Promise.all(blocks.map((block) => processBlockMedia(block)));
}

/**
 * Markdown image pattern: ![alt](url)
 */
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * Process markdown content: download any Notion image URLs and replace with local paths.
 * Notion image URLs expire; storing them locally ensures persistent display.
 */
export async function processMarkdownImages(markdown: string): Promise<string> {
  if (!markdown || typeof markdown !== 'string') return markdown;

  const matches = [...markdown.matchAll(MARKDOWN_IMAGE_RE)];
  if (matches.length === 0) return markdown;

  let result = markdown;
  for (const match of matches) {
    const [fullMatch, alt, url] = match;
    if (!isNotionImageUrl(url)) continue;

    try {
      const filename = getFilenameForNotionUrl(url);
      const localUrl = await downloadMedia(url, filename);
      result = result.replace(fullMatch, `![${alt}](${localUrl})`);
    } catch (error) {
      console.error(`Failed to download image ${url.slice(0, 80)}...:`, error);
    }
  }
  return result;
}
