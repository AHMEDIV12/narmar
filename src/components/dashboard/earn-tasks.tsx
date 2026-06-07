'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Target } from 'lucide-react';

export function EarnTasks() {
  const tasks = [
    {
      id: 1,
      title: 'Image Tagging',
      description: 'Tag 100 product images with relevant keywords',
      category: 'Image Tagging',
      difficulty: 'Easy',
      duration: 15,
      earnings: 1.50,
      assignments: 50,
    },
    {
      id: 2,
      title: 'Data Entry',
      description: 'Enter business data from receipts into spreadsheets',
      category: 'Data Entry',
      difficulty: 'Medium',
      duration: 30,
      earnings: 3.00,
      assignments: 25,
    },
    {
      id: 3,
      title: 'Audio Transcription',
      description: 'Transcribe 10-minute podcast episodes',
      category: 'Transcription',
      difficulty: 'Hard',
      duration: 45,
      earnings: 5.00,
      assignments: 10,
    },
    {
      id: 4,
      title: 'Content Categorization',
      description: 'Categorize 500 articles by topic',
      category: 'Categorization',
      difficulty: 'Easy',
      duration: 20,
      earnings: 2.00,
      assignments: 100,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Complete Tasks</h2>
        <p className="text-muted-foreground">
          Complete micro-tasks and earn money
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Badge className={getDifficultyColor(task.difficulty)}>
                  {task.difficulty}
                </Badge>
              </div>
              <CardDescription>{task.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {task.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {task.duration} min
                  </span>
                </div>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                  {task.earnings.toFixed(2)}
                </span>
              </div>
              <Button className="w-full">
                Start Task
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
