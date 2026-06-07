'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, FileText, DollarSign, Eye, Loader2, Plus, LogOut } from 'lucide-react';
import { calculateEarningsPerView, getEarningsTier } from '@/lib/utils/video-earnings';
import { useAuthStore } from '@/store/auth';

export function AdvertiserDashboard() {
    const logout = useAuthStore((state) => state.logout);
    const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'surveys'>('overview');
    const [earnings, setEarnings] = useState<any>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Video upload form
    const [showVideoForm, setShowVideoForm] = useState(false);
    const [videoForm, setVideoForm] = useState({
        title: '',
        description: '',
        durationSeconds: 0,
        category: 'ENTERTAINMENT',
        targetCountries: '',
        totalBudget: 0,
    });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string>('');
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState('');

    // Survey creation form
    const [showSurveyForm, setShowSurveyForm] = useState(false);
    const [surveyForm, setSurveyForm] = useState({
        title: '',
        description: '',
        estimatedMinutes: 5,
        earningsAmount: 0,
        questions: '',
        maxResponses: 100,
    });
    const [surveyLoading, setSurveyLoading] = useState(false);
    const [surveyError, setSurveyError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [earningsRes, videosRes, surveysRes] = await Promise.all([
                fetch('/api/advertiser/earnings'),
                fetch('/api/advertiser/videos'),
                fetch('/api/advertiser/surveys'),
            ]);

            const earningsData = await earningsRes.json();
            const videosData = await videosRes.json();
            const surveysData = await surveysRes.json();

            setEarnings(earningsData.overview);
            setVideos(videosData.videos || []);
            setSurveys(surveysData.surveys || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('video/')) {
                setVideoError('Please select a valid video file');
                return;
            }

            setVideoFile(file);
            setVideoError('');

            // Create preview URL
            const url = URL.createObjectURL(file);
            setVideoPreview(url);

            // Create video element to get duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                setVideoForm({ ...videoForm, durationSeconds: Math.floor(video.duration) });
                URL.revokeObjectURL(url);
            };
            video.src = url;
        }
    };

    const handleVideoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setVideoError('');
        setVideoLoading(true);

        try {
            if (!videoFile) {
                throw new Error('Please select a video file');
            }

            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('title', videoForm.title);
            if (videoForm.description) formData.append('description', videoForm.description);
            formData.append('durationSeconds', videoForm.durationSeconds.toString());
            formData.append('category', videoForm.category);
            if (videoForm.targetCountries) formData.append('targetCountries', videoForm.targetCountries);
            formData.append('totalBudget', videoForm.totalBudget.toString());

            const res = await fetch('/api/advertiser/videos/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            // Reset form
            setShowVideoForm(false);
            setVideoForm({
                title: '',
                description: '',
                durationSeconds: 0,
                category: 'ENTERTAINMENT',
                targetCountries: '',
                totalBudget: 0,
            });
            setVideoFile(null);
            setVideoPreview('');
            loadData();
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setVideoLoading(false);
        }
    };

    const handleSurveySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSurveyError('');
        setSurveyLoading(true);

        try {
            const res = await fetch('/api/advertiser/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(surveyForm),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Creation failed');
            }

            setShowSurveyForm(false);
            setSurveyForm({
                title: '',
                description: '',
                estimatedMinutes: 5,
                earningsAmount: 0,
                questions: '',
                maxResponses: 100,
            });
            loadData();
        } catch (err) {
            setSurveyError(err instanceof Error ? err.message : 'Creation failed');
        } finally {
            setSurveyLoading(false);
        }
    };

    const earningsPerView = videoForm.durationSeconds > 0
        ? calculateEarningsPerView(videoForm.durationSeconds)
        : 0;
    const earningsTier = videoForm.durationSeconds > 0
        ? getEarningsTier(videoForm.durationSeconds)
        : '';

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Advertiser Dashboard</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setShowVideoForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Video
                    </Button>
                    <Button onClick={() => setShowSurveyForm(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Survey
                    </Button>
                    <Button onClick={handleLogout} variant="destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earnings?.totalEarnings?.toFixed(2) || '0.00'}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Video Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earnings?.totalVideoEarnings?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">{earnings?.totalVideoViews || 0} views</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Survey Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${earnings?.totalSurveyEarnings?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">{earnings?.totalSurveyResponses || 0} responses</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{videos.length + surveys.length}</div>
                        <p className="text-xs text-muted-foreground">{videos.length} videos, {surveys.length} surveys</p>
                    </CardContent>
                </Card>
            </div>

            {/* Video Upload Form */}
            {showVideoForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Video</CardTitle>
                        <CardDescription>Add a new video advertisement</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVideoSubmit} className="space-y-4">
                            {videoError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{videoError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={videoForm.title}
                                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={videoForm.category}
                                        onValueChange={(value) => setVideoForm({ ...videoForm, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TECH">Tech</SelectItem>
                                            <SelectItem value="FASHION">Fashion</SelectItem>
                                            <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
                                            <SelectItem value="FOOD">Food</SelectItem>
                                            <SelectItem value="TRAVEL">Travel</SelectItem>
                                            <SelectItem value="HEALTH">Health</SelectItem>
                                            <SelectItem value="FINANCE">Finance</SelectItem>
                                            <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                                            <SelectItem value="GAMING">Gaming</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={videoForm.description}
                                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="videoFile">Video File *</Label>
                                <Input
                                    id="videoFile"
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoFileChange}
                                    required
                                />
                                {videoPreview && (
                                    <div className="mt-2">
                                        <video
                                            src={videoPreview}
                                            controls
                                            className="w-full max-h-48 rounded border"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Duration: {videoForm.durationSeconds}s
                                            {videoFile && ` • Size: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (seconds) *</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        value={videoForm.durationSeconds || ''}
                                        onChange={(e) => setVideoForm({ ...videoForm, durationSeconds: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                    {earningsTier && (
                                        <p className="text-xs text-muted-foreground">
                                            Tier: {earningsTier} (${earningsPerView.toFixed(2)}/view)
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget ($) *</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={videoForm.totalBudget || ''}
                                        onChange={(e) => setVideoForm({ ...videoForm, totalBudget: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="countries">Target Countries</Label>
                                    <Input
                                        id="countries"
                                        placeholder="US,UK,CA"
                                        value={videoForm.targetCountries}
                                        onChange={(e) => setVideoForm({ ...videoForm, targetCountries: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={videoLoading}>
                                    {videoLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Upload Video
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowVideoForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Survey Creation Form */}
            {showSurveyForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Survey</CardTitle>
                        <CardDescription>Add a new survey for users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSurveySubmit} className="space-y-4">
                            {surveyError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{surveyError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="surveyTitle">Title *</Label>
                                <Input
                                    id="surveyTitle"
                                    value={surveyForm.title}
                                    onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="surveyDescription">Description</Label>
                                <Textarea
                                    id="surveyDescription"
                                    value={surveyForm.description}
                                    onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedMinutes">Est. Minutes *</Label>
                                    <Input
                                        id="estimatedMinutes"
                                        type="number"
                                        min="1"
                                        value={surveyForm.estimatedMinutes}
                                        onChange={(e) => setSurveyForm({ ...surveyForm, estimatedMinutes: parseInt(e.target.value) || 5 })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="earningsAmount">Earnings ($) *</Label>
                                    <Input
                                        id="earningsAmount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={surveyForm.earningsAmount || ''}
                                        onChange={(e) => setSurveyForm({ ...surveyForm, earningsAmount: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxResponses">Max Responses *</Label>
                                    <Input
                                        id="maxResponses"
                                        type="number"
                                        min="1"
                                        value={surveyForm.maxResponses}
                                        onChange={(e) => setSurveyForm({ ...surveyForm, maxResponses: parseInt(e.target.value) || 100 })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="questions">Questions (JSON format) *</Label>
                                <Textarea
                                    id="questions"
                                    value={surveyForm.questions}
                                    onChange={(e) => setSurveyForm({ ...surveyForm, questions: e.target.value })}
                                    placeholder='[{"question": "What is your age?", "type": "number"}]'
                                    rows={4}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter questions as a JSON array
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={surveyLoading}>
                                    {surveyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Create Survey
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowSurveyForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Videos List */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Videos ({videos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {videos.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No videos yet. Upload your first video!</p>
                        ) : (
                            videos.map((video) => (
                                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{video.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {video.totalViews} views • ${video.totalEarnings.toFixed(2)} earned • ${video.earningsPerView.toFixed(2)}/view
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs ${video.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {video.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Surveys List */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Surveys ({surveys.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {surveys.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No surveys yet. Create your first survey!</p>
                        ) : (
                            surveys.map((survey) => (
                                <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{survey.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {survey.totalResponses}/{survey.maxResponses} responses • ${survey.earningsAmount.toFixed(2)}/response
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs ${survey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {survey.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
