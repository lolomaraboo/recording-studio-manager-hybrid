import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommentMarker {
  id: number;
  timestamp: number; // Time in seconds
  content: string;
  authorName: string;
  status: 'open' | 'resolved' | 'archived';
}

interface WaveformPlayerProps {
  src: string;
  title?: string;
  className?: string;
  comments?: CommentMarker[];
  onCommentClick?: (comment: CommentMarker) => void;
  onAddCommentAtTime?: (timestamp: number) => void;
  autoPlay?: boolean;
  showComments?: boolean;
}

export function WaveformPlayer({
  src,
  title,
  className,
  comments = [],
  onCommentClick,
  onAddCommentAtTime,
  autoPlay = false,
  showComments = true,
}: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const regionsPlugin = useRef<RegionsPlugin | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    // Create regions plugin
    regionsPlugin.current = RegionsPlugin.create();

    // Create WaveSurfer instance
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9ca3af',
      progressColor: '#3b82f6',
      cursorColor: '#1d4ed8',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 100,
      normalize: true,
      plugins: [regionsPlugin.current],
    });

    // Load audio
    wavesurfer.current.load(src);

    // Event listeners
    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current?.getDuration() || 0);
      setIsLoading(false);
      if (autoPlay) {
        wavesurfer.current?.play();
        setIsPlaying(true);
      }
    });

    wavesurfer.current.on('audioprocess', (time) => {
      setCurrentTime(time);
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));

    wavesurfer.current.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setError('Failed to load audio file');
      setIsLoading(false);
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [src, autoPlay]);

  // Add comment markers as regions
  useEffect(() => {
    if (!wavesurfer.current || !regionsPlugin.current || !showComments) return;

    // Clear existing regions
    regionsPlugin.current.clearRegions();

    // Add comment markers
    comments.forEach((comment) => {
      const color = comment.status === 'resolved'
        ? 'rgba(34, 197, 94, 0.2)' // green for resolved
        : 'rgba(239, 68, 68, 0.2)'; // red for open

      regionsPlugin.current?.addRegion({
        start: comment.timestamp,
        end: comment.timestamp + 0.5, // Thin marker (0.5s width)
        color,
        drag: false,
        resize: false,
      });
    });

    // Region click handler
    regionsPlugin.current.on('region-clicked', (region: any) => {
      const clickedComment = comments.find(
        (c) => Math.abs(c.timestamp - region.start) < 0.1
      );
      if (clickedComment && onCommentClick) {
        onCommentClick(clickedComment);
      }
    });
  }, [comments, showComments, onCommentClick]);

  const togglePlay = () => {
    if (!wavesurfer.current) return;
    wavesurfer.current.playPause();
  };

  const skip = (seconds: number) => {
    if (!wavesurfer.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    wavesurfer.current.setTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!wavesurfer.current) return;
    const newVolume = value[0];
    wavesurfer.current.setVolume(newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!wavesurfer.current) return;
    if (isMuted) {
      wavesurfer.current.setVolume(volume || 0.5);
      setIsMuted(false);
    } else {
      wavesurfer.current.setVolume(0);
      setIsMuted(true);
    }
  };

  const handleAddComment = () => {
    if (onAddCommentAtTime) {
      onAddCommentAtTime(currentTime);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={cn('p-3 border rounded-lg bg-destructive/10 text-destructive text-sm', className)}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg bg-muted/50', className)}>
      {/* Title */}
      {title && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{title}</p>
          <span className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Waveform Container */}
      <div className="relative">
        <div ref={waveformRef} className="w-full" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-xs text-muted-foreground">Loading waveform...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => skip(-10)}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={togglePlay}
            disabled={isLoading}
            className="h-9 w-9 p-0"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => skip(10)}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Comment Button */}
        {onAddCommentAtTime && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddComment}
            disabled={isLoading}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Add at {formatTime(currentTime)}</span>
          </Button>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            className="h-8 w-8 p-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>

      {/* Comment Count */}
      {showComments && comments.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>
            {comments.length} comment{comments.length !== 1 ? 's' : ''} •{' '}
            {comments.filter((c) => c.status === 'open').length} open
          </span>
        </div>
      )}
    </div>
  );
}
