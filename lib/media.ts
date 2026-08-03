import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';
import { getHelpMediaDir } from './media-dir';

function isHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate a stable filename for an image URL (uses path without query for cache efficiency)
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
 * Process markdown content: download every external image URL and replace with a local path.
 * Covers Notion's own expiring S3 links as well as anything else pasted into the doc
 * (image-sharing services, someone's local dev server, etc.) — any of those can go away
 * or become unreachable, so everything gets rehosted locally on sync.
 */
export async function processMarkdownImages(markdown: string): Promise<string> {
  if (!markdown || typeof markdown !== 'string') return markdown;

  const matches = [...markdown.matchAll(MARKDOWN_IMAGE_RE)];
  if (matches.length === 0) return markdown;

  let result = markdown;
  for (const match of matches) {
    const [fullMatch, alt, url] = match;
    if (!isHttpUrl(url)) continue;

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

function getPublicOrigin(): string {
  return (process.env.HELP_CENTER_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/**
 * Rewrite root-relative `/media/...` references to absolute URLs using this
 * site's public origin. Relative paths resolve fine for direct visits to this
 * site, but content served through the public API (`/api/v1/*`) is rendered
 * inside the embedding site's own page (e.g. the help-center widget on a
 * different domain) — there, a relative `/media/...` src resolves against
 * *that* page's origin instead of ours, 404ing.
 */
export function absolutizeMediaPath(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl || !pathOrUrl.startsWith('/media/')) return pathOrUrl;
  return `${getPublicOrigin()}${pathOrUrl}`;
}

const MARKDOWN_MEDIA_PATH_RE = /(!\[[^\]]*\]\()(\/media\/[^)\s]+)(\))/g;

/** Same as {@link absolutizeMediaPath}, but rewrites every `/media/...` image reference in markdown content. */
export function absolutizeMediaUrlsInContent(markdown: string | undefined): string | undefined {
  if (!markdown) return markdown;
  const origin = getPublicOrigin();
  return markdown.replace(MARKDOWN_MEDIA_PATH_RE, (_full, prefix, mediaPath, suffix) => `${prefix}${origin}${mediaPath}${suffix}`);
}
