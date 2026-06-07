'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Users } from 'lucide-react';

export function EarnSurveys() {
  const surveys = [
    {
      id: 1,
      title: 'Consumer Tech Habits',
      provider: 'TechInsights',
      duration: 10,
      earnings: 2.00,
      responses: 847,
      maxResponses: 1000,
    },
    {
      id: 2,
      title: 'Shopping Preferences',
      provider: 'MarketPulse',
      duration: 15,
      earnings: 3.50,
      responses: 523,
      maxResponses: 800,
    },
    {
      id: 3,
      title: 'Media Consumption Study',
      provider: 'MediaSurvey',
      duration: 20,
      earnings: 5.00,
      responses: 234,
      maxResponses: 500,
    },
    {
      id: 4,
      title: 'Health & Fitness Survey',
      provider: 'HealthPro',
      duration: 12,
      earnings: 2.50,
      responses: 789,
      maxResponses: 1000,
    },
    {
      id: 5,
      title: 'Travel Behavior Analysis',
      provider: 'TravelTrends',
      duration: 18,
      earnings: 4.00,
      responses: 456,
      maxResponses: 600,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Complete Surveys</h2>
        <p className="text-muted-foreground">
          Share your opinion and get paid
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {surveys.map((survey) => (
          <Card key={survey.id}>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg">{survey.title}</CardTitle>
                <Badge>{survey.provider}</Badge>
              </div>
              <CardDescription>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {survey.duration} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <DollarSign className="h-4 w-4" />
                    {survey.earnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {survey.responses} / {survey.maxResponses} responses
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Start Survey
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
