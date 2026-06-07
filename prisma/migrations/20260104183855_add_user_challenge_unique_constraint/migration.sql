/*
  Warnings:

  - A unique constraint covering the columns `[surveyId,userId]` on the table `SurveyResponse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taskId,userId]` on the table `TaskAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,challengeId]` on the table `UserChallenge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyId_userId_key" ON "SurveyResponse"("surveyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");
