'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Clock, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Ad {
  id: string;
  networkId: string;
  networkName: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  contentUrl: string;
  format: string;
  durationSeconds?: number;
  earningsPerView: number;
  category?: string;
}

export function EarnAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [watching, setWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [impressionId, setImpressionId] = useState<string | null>(null);

  // Fetch ads from API
  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/earn/ads');
      const data = await response.json();

      if (response.ok) {
        setAds(data.ads || []);
      } else {
        toast.error(data.error || 'Failed to load ads');
      }
    } catch (error) {
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchAd = async (ad: Ad) => {
    setSelectedAd(ad);
    setWatching(true);
    setTimeRemaining(ad.durationSeconds || 30);

    try {
      // Track impression
      const response = await fetch('/api/earn/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: ad.id,
          screenRes: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setImpressionId(data.impressionId);
      }
    } catch (error) {
      console.error('Failed to track impression:', error);
    }

    // Start countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, (ad.durationSeconds || 30) - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const handleCompleteAd = async () => {
    if (!selectedAd || !impressionId) return;

    const viewDuration = ((selectedAd.durationSeconds || 30) - timeRemaining) * 1000;

    try {
      const response = await fetch('/api/earn/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: selectedAd.id,
          impressionId,
          viewDuration,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const earnings = data.earnings?.finalEarnings || 0;
        toast.success(`Earned $${earnings.toFixed(2)}!`, {
          description: data.fraudWarning ? 'Activity flagged for review' : undefined,
        });

        // Remove watched ad from list
        setAds((prev) => prev.filter((a) => a.id !== selectedAd.id));
      } else if (response.status === 403) {
        toast.error('Ad completion rejected', {
          description: data.reasons?.join(', ') || 'Suspicious activity detected',
        });
      } else {
        toast.error(data.error || 'Failed to complete ad');
      }
    } catch (error) {
      toast.error('Failed to complete ad');
    } finally {
      setSelectedAd(null);
      setWatching(false);
      setImpressionId(null);
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'VIDEO':
        return 'bg-blue-500';
      case 'DISPLAY':
        return 'bg-green-500';
      case 'INTERSTITIAL':
        return 'bg-purple-500';
      case 'OFFERWALL':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading ads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Watch Ads & Earn</CardTitle>
          <CardDescription>
            Earn rewards by watching ads from multiple verified ad networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No ads available right now</p>
              <Button onClick={fetchAds} className="mt-4" variant="outline">
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ads.map((ad) => (
                <Card key={ad.id} className="overflow-hidden">
                  <div className="relative h-40 bg-muted">
                    <img
                      src={ad.thumbnailUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className={`absolute top-2 right-2 ${getFormatColor(ad.format)}`}>
                      {ad.format}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-1">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ad.description || 'Watch and earn rewards'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{ad.durationSeconds || 30}s</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{ad.earningsPerView.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        via {ad.networkName}
                      </p>
                      <Button
                        onClick={() => handleWatchAd(ad)}
                        className="w-full"
                        size="sm"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Watch & Earn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Player Dialog */}
      <Dialog open={watching} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {selectedAd?.format === 'VIDEO' ? (
                <iframe
                  src={selectedAd.contentUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white">{selectedAd?.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-semibold">
                  {timeRemaining > 0 ? `${timeRemaining}s remaining` : 'Complete!'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <DollarSign className="h-5 w-5" />
                <span className="text-lg font-bold">
                  ${selectedAd?.earningsPerView.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCompleteAd}
              disabled={timeRemaining > 0}
              className="w-full"
              size="lg"
            >
              {timeRemaining > 0 ? (
                <>Wait {timeRemaining}s to claim</>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Claim Earnings
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
