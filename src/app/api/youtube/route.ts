import { NextRequest, NextResponse } from 'next/server';

/**
 * YouTube API Route
 *
 * Fetches videos from the ministry YouTube channel.
 * Supports pagination via `pageToken` for video rotation.
 *
 * Query parameters:
 * - maxResults: number of videos (default 6, max 50)
 * - pageToken: pagination token for next page
 */

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  videos: YouTubeVideo[];
  nextPageToken: string | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '6'), 50);
  const pageToken = searchParams.get('pageToken') || null;
  const now = Date.now();

  const cacheKey = pageToken || '__first__';
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ videos: cached.videos, nextPageToken: cached.nextPageToken, cached: true });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      videos: [],
      nextPageToken: null,
      message: 'YouTube API key not configured. Set YOUTUBE_API_KEY to fetch videos.',
    });
  }

  let channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!channelId) {
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=Eagles+Prophetic+Ministries&key=${apiKey}`
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
        }
      }
    } catch { /* ignore */ }
  }

  if (!channelId) {
    return NextResponse.json({ videos: [], nextPageToken: null, message: 'YouTube channel not found.' });
  }

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );

    if (!channelRes.ok) {
      return NextResponse.json({ videos: [], nextPageToken: null, error: 'Failed to fetch channel data' }, { status: 502 });
    }

    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json({ videos: [], nextPageToken: null });
    }

    const playlistParams = new URLSearchParams({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: maxResults.toString(),
      key: apiKey,
    });
    if (pageToken) playlistParams.set('pageToken', pageToken);

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams.toString()}`
    );

    if (!playlistRes.ok) {
      return NextResponse.json({ videos: [], nextPageToken: null, error: 'Failed to fetch videos' }, { status: 502 });
    }

    const playlistData = await playlistRes.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({ videos: [], nextPageToken: null });
    }

    const videos: YouTubeVideo[] = playlistData.items
      .map((item: Record<string, unknown>) => {
        const snippet = item.snippet as Record<string, unknown>;
        const thumbnails = snippet.thumbnails as Record<string, Record<string, string>>;
        const resourceId = snippet.resourceId as Record<string, string>;
        const videoId = resourceId?.videoId || '';
        return {
          videoId,
          title: snippet.title as string,
          description: (snippet.description as string)?.substring(0, 200) || '',
          thumbnail: thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.standard?.url || thumbnails?.default?.url || '',
          publishedAt: snippet.publishedAt as string,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      })
      .filter((v: YouTubeVideo) => v.videoId);

    const nextPageToken = playlistData.nextPageToken || null;

    cache.set(cacheKey, { videos, nextPageToken, timestamp: now });

    return NextResponse.json({ videos, nextPageToken, cached: false });
  } catch (error) {
    console.error('YouTube proxy error:', error);
    return NextResponse.json({ videos: [], nextPageToken: null, error: 'Failed to connect to YouTube API' }, { status: 500 });
  }
}
