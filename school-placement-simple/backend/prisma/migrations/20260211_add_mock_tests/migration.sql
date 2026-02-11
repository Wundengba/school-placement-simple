-- CreateTable Mock
CREATE TABLE "Mock" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mock_pkey" PRIMARY KEY ("id")
);

-- CreateTable MockScore
CREATE TABLE "MockScore" (
    "id" TEXT NOT NULL,
    "mockId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mock_isActive_idx" ON "Mock"("isActive");

-- CreateIndex
CREATE INDEX "Mock_createdAt_idx" ON "Mock"("createdAt");

-- CreateIndex
CREATE INDEX "MockScore_mockId_idx" ON "MockScore"("mockId");

-- CreateIndex
CREATE INDEX "MockScore_studentId_idx" ON "MockScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MockScore_mockId_studentId_subject_key" ON "MockScore"("mockId", "studentId", "subject");

-- AddForeignKey
ALTER TABLE "MockScore" ADD CONSTRAINT "MockScore_mockId_fkey" FOREIGN KEY ("mockId") REFERENCES "Mock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockScore" ADD CONSTRAINT "MockScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
