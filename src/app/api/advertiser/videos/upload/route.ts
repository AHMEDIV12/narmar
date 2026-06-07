import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyAdvertiser } from '@/lib/middleware/advertiser-auth';
import { calculateEarningsPerView } from '@/lib/utils/video-earnings';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadVideoSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    durationSeconds: z.number().int().min(1).max(3600), // Max 1 hour
    category: z.enum(['TECH', 'FASHION', 'AUTOMOTIVE', 'FOOD', 'TRAVEL', 'HEALTH', 'FINANCE', 'ENTERTAINMENT', 'GAMING']).optional(),
    targetCountries: z.string().optional(),
    totalBudget: z.number().min(1),
});

export async function POST(req: NextRequest) {
    // Verify advertiser authentication
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        const formData = await req.formData();
        
        const videoFile = formData.get('video') as File | null;
        if (!videoFile) {
            return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
        }

        // Validate basic text fields
        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string || undefined,
            durationSeconds: parseInt(formData.get('durationSeconds') as string || '0', 10),
            category: formData.get('category') as string || 'ENTERTAINMENT',
            targetCountries: formData.get('targetCountries') as string || undefined,
            totalBudget: parseFloat(formData.get('totalBudget') as string || '0'),
        };

        const validatedData = uploadVideoSchema.parse(rawData);

        // Save file locally
        // Public directory path
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos');
        
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Make unique filename
        const bytes = await videoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueId = uuidv4();
        const extension = videoFile.name.split('.').pop() || 'mp4';
        const fileName = `${uniqueId}.${extension}`;
        
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const videoUrl = `/uploads/videos/${fileName}`;
        const thumbnailUrl = '/placeholder-video.jpg'; // Temporary placeholder

        // Calculate earnings per view based on duration
        const earningsPerView = calculateEarningsPerView(validatedData.durationSeconds);

        // Create the video in DB
        const video = await db.advertiserVideo.create({
            data: {
                advertiserId: advertiserProfile!.id,
                title: validatedData.title,
                description: validatedData.description,
                videoUrl: videoUrl,
                thumbnailUrl: thumbnailUrl,
                durationSeconds: validatedData.durationSeconds,
                category: validatedData.category || 'ENTERTAINMENT',
                targetCountries: validatedData.targetCountries,
                earningsPerView,
                totalBudget: validatedData.totalBudget,
                remainingBudget: validatedData.totalBudget,
            },
        });

        // Update advertiser profile video count
        await db.advertiserProfile.update({
            where: { id: advertiserProfile!.id },
            data: {
                totalVideos: { increment: 1 },
                totalSpent: { increment: validatedData.totalBudget },
            },
        });

        return NextResponse.json({
            video: {
                id: video.id,
                title: video.title,
                description: video.description,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                durationSeconds: video.durationSeconds,
                category: video.category,
                earningsPerView: video.earningsPerView,
                totalBudget: video.totalBudget,
                remainingBudget: video.remainingBudget,
                totalViews: video.totalViews,
                totalEarnings: video.totalEarnings,
                isActive: video.isActive,
                createdAt: video.createdAt,
            },
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Video upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
